import TelegramBot from 'node-telegram-bot-api';
import { registerHandlers } from './handlers.js';
import type { Express } from 'express';

export function startBot(app: Express) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || '';

  // Use webhook mode — no polling, no 409 conflicts
  const bot = new TelegramBot(token, { polling: false });

  registerHandlers(bot);

  // Set up webhook endpoint on Express
  const webhookPath = `/bot${token}`;
  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // Register webhook with Telegram
  if (appUrl) {
    const webhookUrl = `${appUrl}${webhookPath}`;
    bot.setWebHook(webhookUrl).then(() => {
      console.log(`Telegram bot webhook set: ${webhookUrl}`);
    }).catch((err) => {
      console.error('Failed to set webhook:', err.message);
    });
  } else {
    console.warn('APP_URL not set, bot webhook not registered. Set RENDER_EXTERNAL_URL or APP_URL.');
  }
}
