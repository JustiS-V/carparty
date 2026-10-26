import type { IngestPayload } from '@carparty/types';
import { ingestLead } from '../api-client';

/**
 * Public Telegram channels read through their web preview (https://t.me/s/<name>),
 * the page Telegram serves to anyone without logging in. Unlike the user-client
 * collector (telegram.ts) it needs no personal account, so a tester's account
 * can't be restricted for automation. Only channels with a public preview work.
 *
 * TELEGRAM_PUBLIC_CHANNELS=name1,name2   (without @)
 */
const CHANNELS = (process.env.TELEGRAM_PUBLIC_CHANNELS ?? '')
  .split(',')
  .map((c) => c.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\/(s\/)?/, ''))
  .filter(Boolean);
const INTERVAL_MS = Number(process.env.TELEGRAM_PUBLIC_INTERVAL_MS ?? 5 * 60_000);
const USER_AGENT = 'Mozilla/5.0 (compatible; CarPartyBot/0.1; +https://t.me/s)';

const lastSeen = new Map<string, number>();

export interface PublicPost {
  channel: string;
  id: number;
  text: string;
  date?: string;
  photos: string[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

function decode(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i class="emoji"[^>]*><b>([^<]*)<\/b><\/i>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e] ?? m;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parses the posts out of a t.me/s/<channel> page. */
export function parsePublicChannelPage(html: string): PublicPost[] {
  const posts: PublicPost[] = [];
  const blocks = html.split('class="tgme_widget_message_wrap').slice(1);
  for (const block of blocks) {
    const post = block.match(/data-post="([^"/]+)\/(\d+)"/);
    if (!post) continue;
    const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch ? decode(textMatch[1]) : '';
    if (!text) continue;
    const photos = [...block.matchAll(/tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
    const date = block.match(/<time[^>]*datetime="([^"]+)"/)?.[1];
    posts.push({ channel: post[1], id: Number(post[2]), text, date, photos });
  }
  return posts;
}

export function startTelegramPublicCollector(): NodeJS.Timeout | null {
  if (!CHANNELS.length) {
    console.log('[tg-public] Skipped: set TELEGRAM_PUBLIC_CHANNELS');
    return null;
  }
  console.log(`[tg-public] ${CHANNELS.length} channel(s), every ${INTERVAL_MS / 60_000} min: ${CHANNELS.join(', ')}`);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      for (const channel of CHANNELS) {
        await syncChannel(channel).catch((error) => console.error(`[tg-public] ${channel}`, error));
        await new Promise((r) => setTimeout(r, 1500)); // be gentle with t.me
      }
    } finally {
      running = false;
    }
  };
  void tick();
  return setInterval(() => void tick(), INTERVAL_MS);
}

async function syncChannel(channel: string): Promise<void> {
  const response = await fetch(`https://t.me/s/${encodeURIComponent(channel)}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'uk,en;q=0.8' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const posts = parsePublicChannelPage(await response.text());
  if (!posts.length) {
    console.warn(`[tg-public] ${channel}: no posts (private channel or preview disabled?)`);
    return;
  }
  const title = channel;
  const since = lastSeen.get(channel) ?? 0;
  let ingested = 0;
  for (const post of posts.filter((p) => p.id > since)) {
    const payload: IngestPayload = {
      source: 'TELEGRAM',
      externalId: `tgs_${post.channel}_${post.id}`,
      rawText: post.text,
      sourceUrl: `https://t.me/${post.channel}/${post.id}`,
      channelExternalId: `@${post.channel}`,
      channelName: title,
      mediaUrls: post.photos.slice(0, 4),
      postedAt: post.date,
      metadata: { via: 't.me/s', messageId: post.id },
    };
    const result = await ingestLead(payload);
    if (!result.duplicate) ingested++;
  }
  lastSeen.set(channel, Math.max(since, ...posts.map((p) => p.id)));
  if (ingested) console.log(`[tg-public] ${channel}: ${ingested} new post(s)`);
}
