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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Convert Telegram message entities to HTML.
 *  Supports nested/overlapping entities by tracking active tags per character. */
function messageToHtml(text: string, entities?: TelegramBot.MessageEntity[]): string {
  if (!entities || entities.length === 0) {
    return escapeHtml(text).replace(/\n/g, '<br>').replace(/^(<br>)+/, '').replace(/(<br>)+$/, '');
  }

  const chars = [...text];
  const len = chars.length;

  // Parse entities into a stable list with open/close tags
  interface EInfo { start: number; end: number; openTag: string; closeTag: string }
  const ents: EInfo[] = [];

  for (const entity of entities) {
    const start = entity.offset;
    const end = entity.offset + entity.length;

    switch (entity.type) {
      case 'bold': ents.push({ start, end, openTag: '<b>', closeTag: '</b>' }); break;
      case 'italic': ents.push({ start, end, openTag: '<i>', closeTag: '</i>' }); break;
      case 'underline': ents.push({ start, end, openTag: '<u>', closeTag: '</u>' }); break;
      case 'strikethrough': ents.push({ start, end, openTag: '<s>', closeTag: '</s>' }); break;
      case 'code': ents.push({ start, end, openTag: '<code>', closeTag: '</code>' }); break;
      case 'pre': ents.push({ start, end, openTag: '<pre>', closeTag: '</pre>' }); break;
      case 'text_link':
        ents.push({ start, end, openTag: `<a href="${entity.url}" target="_blank" rel="noopener noreferrer">`, closeTag: '</a>' });
        break;
      case 'url': {
        const url = chars.slice(start, end).join('');
        ents.push({ start, end, openTag: `<a href="${url}" target="_blank" rel="noopener noreferrer">`, closeTag: '</a>' });
        break;
      }
    }
  }

  // For each character position, compute which entities are active.
  // When the set of active entities changes, close old tags and open new ones.
  let result = '';
  let activeEnts: EInfo[] = []; // currently open entities, in nesting order

  for (let i = 0; i < len; i++) {
    // Which entities cover position i?
    const wanted = ents.filter(e => e.start <= i && i < e.end);
    // Sort: longer span (outer) first, then by start position (earlier = outer)
    wanted.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);

    // Check if active set changed
    const activeKeys = activeEnts.map(e => e.openTag).join('|');
    const wantedKeys = wanted.map(e => e.openTag).join('|');

    if (activeKeys !== wantedKeys) {
      // Close all currently active tags (reverse order)
      for (let j = activeEnts.length - 1; j >= 0; j--) {
        result += activeEnts[j]!.closeTag;
      }
      // Open all wanted tags
      for (const e of wanted) {
        result += e.openTag;
      }
      activeEnts = wanted;
    }

    result += escapeHtml(chars[i]!);
  }

  // Close remaining
  for (let j = activeEnts.length - 1; j >= 0; j--) {
    result += activeEnts[j]!.closeTag;
  }

  return result.replace(/\n/g, '<br>').replace(/^(<br>)+/, '').replace(/(<br>)+$/, '');
}

function stripHtml(html: string): string {
  return html.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
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
    session.step = 'awaiting_text';
    session.postDraft = {};
    bot.sendMessage(msg.chat.id, '📝 Send the post text:');
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
      `#${p.id} — ${stripHtml(p.description).substring(0, 40)}... (❤️ ${p.like_count})`
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
      `✏️ Editing post #${id}.\n\n` +
      'Which field to edit?\n' +
      'text, image, details, telegram, whatsapp, instagram\n\n' +
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
      `🗑 Delete post #${id}?\nSend YES to confirm:`
    );
  });

  // Handle text messages
  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/') || !isAdmin(msg.chat.id)) return;

    const session = getSession(msg.chat.id);
    const text = msg.text.trim();

    switch (session.step) {
      case 'awaiting_text': {
        session.postDraft.text = messageToHtml(msg.text, msg.entities);
        session.step = 'awaiting_image';
        bot.sendMessage(msg.chat.id,
          '📷 Send a PHOTO, or type "skip" to publish without image:'
        );
        break;
      }

      case 'awaiting_image':
        if (text.toLowerCase() === 'skip') {
          session.postDraft.imageUrl = '';
          session.step = 'awaiting_details';
          bot.sendMessage(msg.chat.id,
            '📝 Send DETAILS text for the modal (or "skip"):'
          );
        }
        break;

      case 'awaiting_details': {
        session.postDraft.detailsText = text.toLowerCase() === 'skip' ? '' : messageToHtml(msg.text, msg.entities);
        session.step = 'awaiting_telegram_link';
        bot.sendMessage(msg.chat.id, '🔗 Send TELEGRAM link (or "skip"):');
        break;
      }

      case 'awaiting_telegram_link':
        session.postDraft.telegramLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'awaiting_whatsapp_link';
        bot.sendMessage(msg.chat.id, '🔗 Send WHATSAPP link (or "skip"):');
        break;

      case 'awaiting_whatsapp_link':
        session.postDraft.whatsappLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'awaiting_instagram_link';
        bot.sendMessage(msg.chat.id, '🔗 Send INSTAGRAM link (or "skip"):');
        break;

      case 'awaiting_instagram_link': {
        session.postDraft.instagramLink = text.toLowerCase() === 'skip' ? '' : text;
        session.step = 'confirm_create';
        const d = session.postDraft;
        bot.sendMessage(msg.chat.id,
          `📋 Post preview:\n\n` +
          `Text: ${stripHtml(d.text || '').substring(0, 100)}...\n` +
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
            description: session.postDraft.text || '',
            imageUrl: session.postDraft.imageUrl || '',
            detailsText: session.postDraft.detailsText || '',
            telegramLink: session.postDraft.telegramLink || '',
            whatsappLink: session.postDraft.whatsappLink || '',
            instagramLink: session.postDraft.instagramLink || '',
          });
          resetSession(msg.chat.id);
          bot.sendMessage(msg.chat.id, `✅ Post created! ID #${post?.id}`);
        } else {
          resetSession(msg.chat.id);
          bot.sendMessage(msg.chat.id, '❌ Post creation cancelled.');
        }
        break;

      case 'awaiting_edit_field':
        session.editField = text.toLowerCase();
        session.step = 'awaiting_edit_value';
        if (session.editField === 'image') {
          bot.sendMessage(msg.chat.id, '📷 Send the new photo:');
        } else if (session.editField === 'text') {
          bot.sendMessage(msg.chat.id, '📝 Send new text:');
        } else if (session.editField === 'details') {
          bot.sendMessage(msg.chat.id, '📝 Send new details text:');
        } else if (['telegram', 'whatsapp', 'instagram'].includes(session.editField)) {
          bot.sendMessage(msg.chat.id, `🔗 Send new ${session.editField} link:`);
        } else {
          bot.sendMessage(msg.chat.id, '❌ Unknown field. Use: text, image, details, telegram, whatsapp, instagram');
          resetSession(msg.chat.id);
        }
        break;

      case 'awaiting_edit_value': {
        const field = session.editField!;
        const editId = session.editPostId!;
        if (field === 'text') {
          const html = messageToHtml(msg.text, msg.entities);
          updatePost(editId, { description: html });
          bot.sendMessage(msg.chat.id, `✅ Post #${editId} text updated!`);
        } else if (field === 'details') {
          const html = messageToHtml(msg.text, msg.entities);
          updatePost(editId, { detailsText: html });
          bot.sendMessage(msg.chat.id, `✅ Post #${editId} details updated!`);
        } else if (field === 'telegram') {
          updatePost(editId, { telegramLink: text });
          bot.sendMessage(msg.chat.id, `✅ Post #${editId} telegram link updated!`);
        } else if (field === 'whatsapp') {
          updatePost(editId, { whatsappLink: text });
          bot.sendMessage(msg.chat.id, `✅ Post #${editId} whatsapp link updated!`);
        } else if (field === 'instagram') {
          updatePost(editId, { instagramLink: text });
          bot.sendMessage(msg.chat.id, `✅ Post #${editId} instagram link updated!`);
        }
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

    if (session.step !== 'awaiting_text' &&
        session.step !== 'awaiting_image' &&
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

      if (session.step === 'awaiting_text') {
        // Photo with caption on text step — save both text and image, skip awaiting_image
        if (msg.caption) {
          session.postDraft.text = messageToHtml(msg.caption, msg.caption_entities);
        }
        session.postDraft.imageUrl = imageUrl;
        session.step = 'awaiting_details';
        bot.sendMessage(msg.chat.id,
          '✅ Image saved!\n📝 Send DETAILS text for the modal (or "skip"):'
        );
      } else if (session.step === 'awaiting_image') {
        // Don't overwrite text with caption if text was already set
        if (msg.caption && !session.postDraft.text) {
          session.postDraft.text = messageToHtml(msg.caption, msg.caption_entities);
        }
        session.postDraft.imageUrl = imageUrl;
        session.step = 'awaiting_details';
        bot.sendMessage(msg.chat.id,
          '✅ Image saved!\n📝 Send DETAILS text for the modal (or "skip"):'
        );
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
