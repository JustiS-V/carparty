import 'dotenv/config';
import { runBot } from './bot';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required. See apps/bot/.env.example');
  process.exit(1);
}

runBot(token);
