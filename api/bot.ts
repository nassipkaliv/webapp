import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllPosts, getPostById, createPost, updatePost, deletePost, type PostRow,
} from './_db.js';

// Simple in-memory sessions (per serverless invocation — stateless between cold starts)
// For a production bot, use a DB-backed session store
interface BotSession {
  step: string;
  postDraft: Record<string, unknown>;
  editPostId?: number;
  editField?: string;
}
const sessions = new Map<number, BotSession>();

function getSession(chatId: number): BotSession {
  if (!sessions.has(chatId)) sessions.set(chatId, { step: 'idle', postDraft: {} });
  return sessions.get(chatId)!;
}
function resetSession(chatId: number) {
  sessions.set(chatId, { step: 'idle', postDraft: {} });
}

const ADMIN_IDS = (process.env.ADMIN_CHAT_IDS || '').split(',').map(id => Number(id.trim())).filter(Boolean);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

function isAdmin(chatId: number) { return ADMIN_IDS.includes(chatId); }

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify bot token in URL for security
  const { token } = req.query;
  if (token !== BOT_TOKEN) return res.status(403).json({ error: 'Forbidden' });

  if (req.method !== 'POST') return res.status(405).end();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });

  const update = req.body;
  const msg = update?.message;
  if (!msg) return res.status(200).end();

  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();

  if (!chatId || !isAdmin(chatId)) {
    if (chatId) await sendMessage(chatId, '⛔ Access denied.');
    return res.status(200).end();
  }

  const session = getSession(chatId);

  // Commands
  if (text === '/start') {
    await sendMessage(chatId,
      '🤖 Post Manager Bot\n\n' +
      '/newpost — Create a new post\n' +
      '/listposts — List all posts\n' +
      '/editpost <id> — Edit a post\n' +
      '/deletepost <id> — Delete a post\n' +
      '/cancel — Cancel current operation'
    );
    return res.status(200).end();
  }

  if (text === '/cancel') {
    resetSession(chatId);
    await sendMessage(chatId, '❌ Operation cancelled.');
    return res.status(200).end();
  }

  if (text === '/newpost') {
    session.step = 'awaiting_title';
    session.postDraft = {};
    await sendMessage(chatId, '📝 Step 1/9: Send the post TITLE:');
    return res.status(200).end();
  }

  if (text === '/listposts') {
    const posts = await getAllPosts();
    if (posts.length === 0) {
      await sendMessage(chatId, '📭 No posts found.');
    } else {
      const list = posts.map((p: PostRow) => `#${p.id} — ${p.title} (❤️ ${p.like_count})`).join('\n');
      await sendMessage(chatId, `📋 Posts:\n${list}`);
    }
    return res.status(200).end();
  }

  const editMatch = text.match(/^\/editpost (\d+)$/);
  if (editMatch) {
    const id = Number(editMatch[1]);
    const post = await getPostById(id);
    if (!post) { await sendMessage(chatId, `❌ Post #${id} not found.`); return res.status(200).end(); }
    session.step = 'awaiting_edit_field';
    session.editPostId = id;
    await sendMessage(chatId,
      `✏️ Editing post #${id} "${post.title}".\n\n` +
      'Which field? title, description, whyTitle, whyItems, detailsText, telegramLink, whatsappLink, instagramLink\n\nSend the field name:'
    );
    return res.status(200).end();
  }

  const deleteMatch = text.match(/^\/deletepost (\d+)$/);
  if (deleteMatch) {
    const id = Number(deleteMatch[1]);
    const post = await getPostById(id);
    if (!post) { await sendMessage(chatId, `❌ Post #${id} not found.`); return res.status(200).end(); }
    session.step = 'awaiting_delete_confirm';
    session.editPostId = id;
    await sendMessage(chatId, `🗑 Delete post #${id} "${post.title}"?\nSend YES to confirm:`);
    return res.status(200).end();
  }

  // Conversational flow
  if (text.startsWith('/')) return res.status(200).end();

  switch (session.step) {
    case 'awaiting_title':
      session.postDraft.title = text;
      session.step = 'awaiting_description';
      await sendMessage(chatId, '📝 Step 2/9: Send the DESCRIPTION:');
      break;

    case 'awaiting_description':
      session.postDraft.description = text;
      session.step = 'awaiting_why_title';
      await sendMessage(chatId, '📝 Step 3/9: Send the "Why" section TITLE (or "skip"):');
      break;

    case 'awaiting_why_title':
      session.postDraft.whyTitle = text.toLowerCase() === 'skip' ? 'Why Choose Us' : text;
      session.step = 'awaiting_why_items';
      await sendMessage(chatId, '📝 Step 4/9: Send list items, one per line (or "skip"):');
      break;

    case 'awaiting_why_items':
      session.postDraft.whyItems = text.toLowerCase() === 'skip' ? [] : text.split('\n').map((s: string) => s.trim()).filter(Boolean);
      session.step = 'awaiting_image';
      await sendMessage(chatId, '📷 Step 5/9: Send image URL (or "skip"):');
      break;

    case 'awaiting_image':
      session.postDraft.imageUrl = text.toLowerCase() === 'skip' ? '' : text;
      session.step = 'awaiting_details_text';
      await sendMessage(chatId, '📝 Step 6/9: Send DETAILS TEXT for modal (or "skip"):');
      break;

    case 'awaiting_details_text':
      session.postDraft.detailsText = text.toLowerCase() === 'skip' ? '' : text;
      session.step = 'awaiting_telegram_link';
      await sendMessage(chatId, '📝 Step 7/9: Send TELEGRAM link (or "skip"):');
      break;

    case 'awaiting_telegram_link':
      session.postDraft.telegramLink = text.toLowerCase() === 'skip' ? '' : text;
      session.step = 'awaiting_whatsapp_link';
      await sendMessage(chatId, '📝 Step 8/9: Send WHATSAPP link (or "skip"):');
      break;

    case 'awaiting_whatsapp_link':
      session.postDraft.whatsappLink = text.toLowerCase() === 'skip' ? '' : text;
      session.step = 'awaiting_instagram_link';
      await sendMessage(chatId, '📝 Step 9/9: Send INSTAGRAM link (or "skip"):');
      break;

    case 'awaiting_instagram_link': {
      session.postDraft.instagramLink = text.toLowerCase() === 'skip' ? '' : text;
      session.step = 'confirm_create';
      const d = session.postDraft;
      await sendMessage(chatId,
        `📋 Post summary:\n\nTitle: ${d.title}\nDescription: ${String(d.description).substring(0, 100)}...\n` +
        `Why title: ${d.whyTitle}\nWhy items: ${Array.isArray(d.whyItems) ? d.whyItems.length : 0} items\n` +
        `Image: ${d.imageUrl ? '✅' : '❌'}\nDetails: ${d.detailsText ? '✅' : '❌'}\n` +
        `TG: ${d.telegramLink || '—'}\nWA: ${d.whatsappLink || '—'}\nIG: ${d.instagramLink || '—'}\n\nSend YES to publish, or /cancel.`
      );
      break;
    }

    case 'confirm_create':
      if (text.toUpperCase() === 'YES') {
        const d = session.postDraft;
        const post = await createPost({
          title: d.title as string, description: d.description as string,
          whyTitle: (d.whyTitle as string) || 'Why Choose Us', whyItems: (d.whyItems as string[]) || [],
          imageUrl: (d.imageUrl as string) || '', telegramLink: (d.telegramLink as string) || '',
          whatsappLink: (d.whatsappLink as string) || '', instagramLink: (d.instagramLink as string) || '',
          detailsText: (d.detailsText as string) || '',
        });
        resetSession(chatId);
        await sendMessage(chatId, `✅ Post created! ID #${post?.id}`);
      } else {
        resetSession(chatId);
        await sendMessage(chatId, '❌ Post creation cancelled.');
      }
      break;

    case 'awaiting_edit_field':
      session.editField = text;
      session.step = 'awaiting_edit_value';
      await sendMessage(chatId, `📝 Send new value for "${text}":`);
      break;

    case 'awaiting_edit_value': {
      const field = session.editField!;
      const editId = session.editPostId!;
      let value: unknown = text;
      if (field === 'whyItems') value = text.split('\n').map((s: string) => s.trim()).filter(Boolean);
      await updatePost(editId, { [field]: value });
      await sendMessage(chatId, `✅ Post #${editId} updated! Field "${field}" changed.`);
      resetSession(chatId);
      break;
    }

    case 'awaiting_delete_confirm': {
      const delId = session.editPostId!;
      if (text.toUpperCase() === 'YES') {
        await deletePost(delId);
        await sendMessage(chatId, `✅ Post #${delId} deleted.`);
      } else {
        await sendMessage(chatId, '❌ Delete cancelled.');
      }
      resetSession(chatId);
      break;
    }
  }

  return res.status(200).end();
}
