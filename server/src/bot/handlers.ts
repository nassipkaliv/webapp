import TelegramBot from 'node-telegram-bot-api';
import { getSession, resetSession } from './sessions.js';
import {
  getAllPosts, getPostById, createPost, updatePost, deletePost, type PostRow,
} from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ADMIN_IDS = (process.env.ADMIN_CHAT_IDS || '')
  .split(',')
  .map(id => Number(id.trim()))
  .filter(Boolean);

function isAdmin(chatId: number): boolean {
  return ADMIN_IDS.includes(chatId);
}

export function registerHandlers(bot: TelegramBot) {
  // /start
  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg.chat.id)) {
      bot.sendMessage(msg.chat.id, '⛔ Access denied. You are not an admin.');
      return;
    }
    bot.sendMessage(msg.chat.id,
      '🤖 Post Manager Bot\n\n' +
      'Commands:\n' +
      '/newpost — Create a new post\n' +
      '/listposts — List all posts\n' +
      '/editpost <id> — Edit a post\n' +
      '/deletepost <id> — Delete a post\n' +
      '/cancel — Cancel current operation'
    );
  });

  // /cancel
  bot.onText(/\/cancel/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, '❌ Operation cancelled.');
  });

  // /newpost
  bot.onText(/\/newpost/, (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const session = getSession(msg.chat.id);
    session.step = 'awaiting_title';
    session.postDraft = {};
    bot.sendMessage(msg.chat.id, '📝 Step 1/9: Send the post TITLE:');
  });

  // /listposts
  bot.onText(/\/listposts/, (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const posts = getAllPosts();
    if (posts.length === 0) {
      bot.sendMessage(msg.chat.id, '📭 No posts found.');
      return;
    }
    const list = posts.map((p: PostRow) =>
      `#${p.id} — ${p.title} (❤️ ${p.like_count})`
    ).join('\n');
    bot.sendMessage(msg.chat.id, `📋 Posts:\n${list}`);
  });

  // /editpost <id>
  bot.onText(/\/editpost (\d+)/, (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const id = Number(match![1]);
    const post = getPostById(id);
    if (!post) {
      bot.sendMessage(msg.chat.id, `❌ Post #${id} not found.`);
      return;
    }
    const session = getSession(msg.chat.id);
    session.step = 'awaiting_edit_field';
    session.editPostId = id;
    bot.sendMessage(msg.chat.id,
      `✏️ Editing post #${id} "${post.title}".\n\n` +
      'Which field to edit?\n' +
      'title, description, whyTitle, whyItems, image, detailsText, ' +
      'telegramLink, whatsappLink, instagramLink\n\n' +
      'Send the field name:'
    );
  });

  // /deletepost <id>
  bot.onText(/\/deletepost (\d+)/, (msg, match) => {
    if (!isAdmin(msg.chat.id)) return;
    const id = Number(match![1]);
    const post = getPostById(id);
    if (!post) {
      bot.sendMessage(msg.chat.id, `❌ Post #${id} not found.`);
      return;
    }
    const session = getSession(msg.chat.id);
    session.step = 'awaiting_delete_confirm';
    session.editPostId = id;
    bot.sendMessage(msg.chat.id,
      `🗑 Delete post #${id} "${post.title}"?\nSend YES to confirm:`
    );
  });

  // Handle text messages for conversational flow
  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/') || !isAdmin(msg.chat.id)) return;

    const session = getSession(msg.chat.id);
    const text = msg.text.trim();

    switch (session.step) {
      case 'awaiting_title':
        session.postDraft.title = text;
        session.step = 'awaiting_description';
        bot.sendMessage(msg.chat.id, '📝 Step 2/9: Send the DESCRIPTION:');
        break;

      case 'awaiting_description':
        session.postDraft.description = text;
        session.step = 'awaiting_why_title';
        bot.sendMessage(msg.chat.id,
          '📝 Step 3/9: Send the "Why" section TITLE (or "skip" for default):'
        );
        break;

      case 'awaiting_why_title':
        session.postDraft.whyTitle = text.toLowerCase() === 'skip' ? 'Why Choose Us' : text;
        session.step = 'awaiting_why_items';
        bot.sendMessage(msg.chat.id,
          '📝 Step 4/9: Send list items, one per line:'
        );
        break;

      case 'awaiting_why_items':
        if (text.toLowerCase() === 'skip') {
          session.postDraft.whyItems = [];
        } else {
          session.postDraft.whyItems = text.split('\n').map(s => s.trim()).filter(Boolean);
        }
        session.step = 'awaiting_image';
        bot.sendMessage(msg.chat.id,
          '📷 Step 5/9: Send a PHOTO (or "skip"):'
        );
        break;

      case 'awaiting_image':
        if (text.toLowerCase() === 'skip') {
          session.postDraft.imageUrl = '';
          session.step = 'awaiting_details_text';
          bot.sendMessage(msg.chat.id, '📝 Step 6/9: Send DETAILS TEXT for modal (or "skip"):');
        }
        break;

      case 'awaiting_details_text':
        session.postDraft.detailsText = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'awaiting_telegram_link';
        bot.sendMessage(msg.chat.id, '📝 Step 7/9: Send TELEGRAM link (or "skip"):');
        break;

      case 'awaiting_telegram_link':
        session.postDraft.telegramLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'awaiting_whatsapp_link';
        bot.sendMessage(msg.chat.id, '📝 Step 8/9: Send WHATSAPP link (or "skip"):');
        break;

      case 'awaiting_whatsapp_link':
        session.postDraft.whatsappLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'awaiting_instagram_link';
        bot.sendMessage(msg.chat.id, '📝 Step 9/9: Send INSTAGRAM link (or "skip"):');
        break;

      case 'awaiting_instagram_link': {
        session.postDraft.instagramLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'confirm_create';
        const d = session.postDraft;
        bot.sendMessage(msg.chat.id,
          `📋 Post summary:\n\n` +
          `Title: ${d.title}\n` +
          `Description: ${d.description?.substring(0, 100)}...\n` +
          `Why title: ${d.whyTitle}\n` +
          `Why items: ${d.whyItems?.length || 0} items\n` +
          `Image: ${d.imageUrl ? '✅' : '❌'}\n` +
          `Details: ${d.detailsText ? '✅' : '❌'}\n` +
          `TG: ${d.telegramLink || '—'}\n` +
          `WA: ${d.whatsappLink || '—'}\n` +
          `IG: ${d.instagramLink || '—'}\n\n` +
          `Send YES to publish, or /cancel.`
        );
        break;
      }

      case 'confirm_create':
        if (text.toUpperCase() === 'YES') {
          const post = createPost({
            title: session.postDraft.title!,
            description: session.postDraft.description!,
            whyTitle: session.postDraft.whyTitle || 'Why Choose Us',
            whyItems: session.postDraft.whyItems || [],
            imageUrl: session.postDraft.imageUrl || '',
            telegramLink: session.postDraft.telegramLink || '',
            whatsappLink: session.postDraft.whatsappLink || '',
            instagramLink: session.postDraft.instagramLink || '',
            detailsText: session.postDraft.detailsText || '',
          });
          resetSession(msg.chat.id);
          bot.sendMessage(msg.chat.id, `✅ Post created! ID #${post?.id}`);
        } else {
          resetSession(msg.chat.id);
          bot.sendMessage(msg.chat.id, '❌ Post creation cancelled.');
        }
        break;

      case 'awaiting_edit_field':
        session.editField = text;
        session.step = 'awaiting_edit_value';
        if (text === 'image') {
          bot.sendMessage(msg.chat.id, '📷 Send the new photo:');
        } else if (text === 'whyItems') {
          bot.sendMessage(msg.chat.id, '📝 Send new list items, one per line:');
        } else {
          bot.sendMessage(msg.chat.id, `📝 Send new value for "${text}":`);
        }
        break;

      case 'awaiting_edit_value': {
        const field = session.editField!;
        const editId = session.editPostId!;
        let value: string | string[] = text;
        if (field === 'whyItems') {
          value = text.split('\n').map(s => s.trim()).filter(Boolean);
        }
        updatePost(editId, { [field]: value });
        bot.sendMessage(msg.chat.id, `✅ Post #${editId} updated! Field "${field}" changed.`);
        resetSession(msg.chat.id);
        break;
      }

      case 'awaiting_delete_confirm': {
        const delId = session.editPostId!;
        if (text.toUpperCase() === 'YES') {
          deletePost(delId);
          bot.sendMessage(msg.chat.id, `✅ Post #${delId} deleted.`);
        } else {
          bot.sendMessage(msg.chat.id, '❌ Delete cancelled.');
        }
        resetSession(msg.chat.id);
        break;
      }

      default:
        break;
    }
  });

  // Handle photo messages
  bot.on('photo', async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    const session = getSession(msg.chat.id);

    if (session.step !== 'awaiting_image' &&
        !(session.step === 'awaiting_edit_value' && session.editField === 'image')) {
      return;
    }

    const photos = msg.photo!;
    const largest = photos[photos.length - 1]!;

    try {
      const fileLink = await bot.getFileLink(largest.file_id);
      const response = await fetch(fileLink);
      const buffer = Buffer.from(await response.arrayBuffer());

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const filename = `post-${Date.now()}.jpg`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filepath, buffer);

      const imageUrl = `/uploads/${filename}`;

      if (session.step === 'awaiting_image') {
        session.postDraft.imageUrl = imageUrl;
        session.step = 'awaiting_details_text';
        bot.sendMessage(msg.chat.id, '✅ Image saved!\n📝 Step 6/9: Send DETAILS TEXT for modal (or "skip"):');
      } else {
        const editId = session.editPostId!;
        updatePost(editId, { imageUrl });
        bot.sendMessage(msg.chat.id, `✅ Post #${editId} image updated!`);
        resetSession(msg.chat.id);
      }
    } catch {
      bot.sendMessage(msg.chat.id, '❌ Failed to download image. Try again.');
    }
  });
}
