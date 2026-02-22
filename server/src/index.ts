import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import postsRouter from './routes/posts.js';
import { initDb } from './db.js';
import { startBot } from './bot/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Initialize database
  await initDb();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // API routes
  app.use('/api/posts', postsRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Start Telegram bot (webhook mode — needs app for route)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_bot_token_here') {
    startBot(app);
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not set, bot will not start');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
