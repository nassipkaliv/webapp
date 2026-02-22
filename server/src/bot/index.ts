import TelegramBot from 'node-telegram-bot-api';
import { registerHandlers } from './handlers.js';

export function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const bot = new TelegramBot(token, { polling: true });

  registerHandlers(bot);

  console.log('Telegram bot started (polling mode)');

  process.on('SIGINT', () => {
    bot.stopPolling();
    process.exit(0);
  });
}
