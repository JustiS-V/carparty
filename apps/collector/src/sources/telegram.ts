import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import type { IngestPayload } from '@carparty/types';
import { ingestLead } from '../api-client';

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  session: string;
  channels: string[];
}

function readConfig(): TelegramConfig | null {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = process.env.TELEGRAM_SESSION;
  const channels = (process.env.TELEGRAM_CHANNELS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!apiId || !apiHash || !session || channels.length === 0) {
    return null;
  }

  return { apiId, apiHash, session, channels };
}

export async function startTelegramCollector(): Promise<void> {
  const config = readConfig();
  if (!config) {
    console.log('[telegram] Пропуск: задайте TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION, TELEGRAM_CHANNELS');
    return;
  }

  const client = new TelegramClient(
    new StringSession(config.session),
    config.apiId,
    config.apiHash,
    { connectionRetries: 5 },
  );

  await client.start({
    phoneNumber: async () => '',
    password: async () => '',
    phoneCode: async () => '',
    onError: (error) => console.error('[telegram] auth error', error),
  });

  console.log(`[telegram] Подключено. Каналы: ${config.channels.join(', ')}`);

  for (const channel of config.channels) {
    client.addEventHandler(
      async (event) => {
        const message = event.message;
        if (!message?.message) return;

        const chat = await message.getChat();
        if (!chat) return;

        const username =
          'username' in chat && chat.username ? `@${chat.username}` : String(message.chatId ?? channel);

        const payload: IngestPayload = {
          source: 'TELEGRAM',
          externalId: `${message.chatId}_${message.id}`,
          rawText: message.message,
          sourceUrl: buildTelegramMessageUrl(username, message.id),
          channelExternalId: username,
          channelName: 'title' in chat ? String(chat.title) : username,
          mediaUrls: [],
          metadata: {
            messageId: message.id,
            chatId: message.chatId?.toString(),
          },
          postedAt: message.date ? new Date(message.date * 1000).toISOString() : undefined,
        };

        try {
          const result = await ingestLead(payload);
          console.log(
            `[telegram] ${result.duplicate ? 'duplicate' : 'ingested'} ${payload.externalId} from ${username}`,
          );
        } catch (error) {
          console.error('[telegram] ingest error', error);
        }
      },
      new NewMessage({ chats: [channel] }),
    );
  }
}

function buildTelegramMessageUrl(channel: string, messageId: number): string | undefined {
  const normalized = channel.replace(/^@/, '');
  if (!normalized) return undefined;
  return `https://t.me/${normalized}/${messageId}`;
}

export async function backfillTelegramChannel(channel: string, limit = 50): Promise<void> {
  const config = readConfig();
  if (!config) {
    throw new Error('Telegram credentials are not configured');
  }

  const client = new TelegramClient(
    new StringSession(config.session),
    config.apiId,
    config.apiHash,
    { connectionRetries: 5 },
  );

  await client.connect();

  const entity = await client.getEntity(channel);
  const messages = await client.getMessages(entity, { limit });

  for (const message of messages.reverse()) {
    if (!message.message) continue;

    const username =
      'username' in entity && entity.username ? `@${entity.username}` : channel;

    await ingestLead({
      source: 'TELEGRAM',
      externalId: `${message.chatId}_${message.id}`,
      rawText: message.message,
      sourceUrl: buildTelegramMessageUrl(username, message.id),
      channelExternalId: username,
      channelName: 'title' in entity ? String(entity.title) : username,
      metadata: { backfill: true, messageId: message.id },
      postedAt: message.date ? new Date(message.date * 1000).toISOString() : undefined,
    });
  }

  await client.disconnect();
  console.log(`[telegram] Backfill done for ${channel}, ${messages.length} messages scanned`);
}
