import { resolveTelegramChannels } from './config/ua-channels';
import { startAutoRiaCollector } from './sources/auto-ria';
import { startOlxUaCollector } from './sources/olx-ua';
import { startTelegramCollector } from './sources/telegram';

async function main() {
  console.log('[collector] CarParty UA collector starting...');

  const channels = resolveTelegramChannels(process.env.TELEGRAM_CHANNELS);
  if (channels.length) {
    console.log(`[collector] Telegram channels (${channels.length}): ${channels.join(', ')}`);
    process.env.TELEGRAM_CHANNELS = channels.join(',');
  }

  await startTelegramCollector();
  startAutoRiaCollector();
  startOlxUaCollector();

  const hasTelegram = Boolean(process.env.TELEGRAM_API_ID);
  console.log(
    `[collector] Active: telegram=${hasTelegram ? 'yes' : 'no'}, autoria=${process.env.AUTORIA_API_KEY ? 'yes' : 'no'}, olx=yes`,
  );
  console.log('[collector] Running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  console.error('[collector] fatal', error);
  process.exit(1);
});
