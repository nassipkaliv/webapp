import TelegramBot from 'node-telegram-bot-api';
import { registerHandlers } from './handlers.js';
import type { Express } from 'express';

export function startBot(app: Express) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || '';

  // If we have an HTTPS app URL, use webhook mode; otherwise use polling
  const useWebhook = appUrl.startsWith('https://');

  const bot = new TelegramBot(token, { polling: !useWebhook });

  registerHandlers(bot);

  if (useWebhook) {
    // Set up webhook endpoint on Express
    const webhookPath = `/bot${token}`;
    app.post(webhookPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    const webhookUrl = `${appUrl}${webhookPath}`;
    bot.setWebHook(webhookUrl).then(() => {
      console.log(`Telegram bot webhook set: ${webhookUrl}`);
    }).catch((err) => {
      console.error('Failed to set webhook:', err.message);
    });
  } else {
    // Delete any existing webhook so polling works
    bot.deleteWebHook().then(() => {
      console.log('Telegram bot started in polling mode');
    }).catch(() => {
      console.log('Telegram bot started in polling mode');
    });
  }
}
