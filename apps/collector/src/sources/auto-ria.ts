import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { IngestPayload } from '@carparty/types';
import { ingestLead } from '../api-client';

/**
 * AUTO.RIA official API (developers.ria.com). Every call counts against the
 * key's quota — the free key allows 30 requests per hour and 1,000 in total —
 * so the collector works to a per-hour budget: one search for the newest used
 * cars, then /auto/info only for ids it has not seen before (persisted across
 * restarts, so a restart does not re-spend requests).
 */
const API_KEY = process.env.AUTORIA_API_KEY ?? '';
const BASE = 'https://developers.ria.com/auto';
const MAX_PER_HOUR = Number(process.env.AUTORIA_MAX_REQUESTS_PER_HOUR ?? 28);
const SYNC_INTERVAL_MS = Number(process.env.AUTORIA_SYNC_INTERVAL_MS ?? 30 * 60_000);
const STATE_FILE = process.env.AUTORIA_STATE_FILE ?? '/tmp/carparty/autoria-seen.json';
const SEEN_LIMIT = 5_000;

let seen = loadSeen();
const requestLog: number[] = [];

interface SearchResponse {
  result?: { search_result?: { ids?: Array<number | string>; count?: number } };
}

/** The fields of /auto/info this collector uses. */
export interface AutoRiaInfo {
  title?: string;
  markName?: string;
  modelName?: string;
  USD?: number;
  UAH?: number;
  linkToView?: string;
  addDate?: string;
  autoData?: { autoId?: number; year?: number; race?: string; fuelName?: string; gearboxName?: string; description?: string; isSold?: boolean };
  stateData?: { name?: string; regionName?: string };
  photoData?: { seoLinkF?: string; seoLinkM?: string; seoLinkB?: string };
}

export function startAutoRiaCollector(): NodeJS.Timeout | null {
  if (!API_KEY) {
    console.log('[autoria] Skipped: set AUTORIA_API_KEY (developers.ria.com)');
    return null;
  }
  const perTick = Math.max(2, Math.floor((MAX_PER_HOUR * SYNC_INTERVAL_MS) / 3_600_000));
  console.log(`[autoria] every ${SYNC_INTERVAL_MS / 60_000} min, ≤${MAX_PER_HOUR} requests/hour (≤${perTick} per run)`);

  const tick = () => {
    syncAutoRia(perTick).catch((error) => console.error('[autoria]', error));
  };
  tick();
  return setInterval(tick, SYNC_INTERVAL_MS);
}

function budgetLeft(): number {
  const hourAgo = Date.now() - 3_600_000;
  while (requestLog.length && requestLog[0] < hourAgo) requestLog.shift();
  return MAX_PER_HOUR - requestLog.length;
}

async function call<T>(path: string, params: Record<string, string>): Promise<T | null> {
  if (budgetLeft() <= 0) return null;
  requestLog.push(Date.now());
  const query = new URLSearchParams({ api_key: API_KEY, ...params });
  const response = await fetch(`${BASE}${path}?${query}`);
  if (response.status === 429) {
    console.warn('[autoria] rate limited by AUTO.RIA (429) — waiting for the next run');
    requestLog.push(...Array(MAX_PER_HOUR).fill(Date.now()));
    return null;
  }
  if (!response.ok) throw new Error(`AUTO.RIA ${path} ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return (await response.json()) as T;
}

async function syncAutoRia(perTick: number): Promise<void> {
  const search = await call<SearchResponse>('/search', {
    category_id: '1',
    searchType: '4', // used cars only
    order_by: '7', // newest listings first
    currency: '1', // USD
    countpage: '30',
    page: '0',
  });
  const ids = (search?.result?.search_result?.ids ?? []).map(String).filter((id) => !seen.has(id));
  if (!ids.length) return;

  let ingested = 0;
  for (const id of ids.slice(0, Math.max(0, perTick - 1))) {
    const info = await call<AutoRiaInfo>('/info', { auto_id: id });
    if (!info) break; // budget spent
    seen.add(id);
    if (info.autoData?.isSold) continue;
    const result = await ingestLead(toPayload(id, info));
    if (!result.duplicate) ingested++;
  }
  saveSeen();
  console.log(`[autoria] ${ingested} new listing(s); ${ids.length} unseen in the latest search; ${budgetLeft()} requests left this hour`);
}

export function toPayload(id: string, info: AutoRiaInfo): IngestPayload {
  const a = info.autoData ?? {};
  const link = info.linkToView ? `https://auto.ria.com${info.linkToView.startsWith('/') ? '' : '/'}${info.linkToView}` : `https://auto.ria.com/uk/auto___${id}.html`;
  const photo = info.photoData?.seoLinkB ?? info.photoData?.seoLinkF ?? info.photoData?.seoLinkM;
  const lines = [
    info.title ?? [info.markName, info.modelName, a.year].filter(Boolean).join(' '),
    info.USD ? `Ціна: ${info.USD} $` : null,
    [a.race, a.fuelName, a.gearboxName].filter(Boolean).join(', ') || null,
    info.stateData?.name ? `Місто: ${info.stateData.name}` : null,
    a.description?.slice(0, 600) ?? null,
  ].filter(Boolean);

  return {
    source: 'AUTO_RIA',
    externalId: `autoria_${id}`,
    rawText: lines.join('\n'),
    sourceUrl: link,
    channelExternalId: 'auto.ria.com',
    channelName: 'AUTO.RIA',
    mediaUrls: photo ? [photo] : [],
    postedAt: isoDate(info.addDate),
    metadata: { autoRiaId: Number(id), region: info.stateData?.regionName },
    structured: {
      make: info.markName,
      model: info.modelName,
      year: a.year,
      price: info.USD,
      currency: info.USD ? 'USD' : undefined,
      region: info.stateData?.name,
    },
  };
}

function isoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(readFileSync(STATE_FILE, 'utf8')) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(): void {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true });
    const list = [...seen].slice(-SEEN_LIMIT);
    seen = new Set(list);
    writeFileSync(STATE_FILE, JSON.stringify(list));
  } catch (error) {
    console.warn('[autoria] could not save state', error);
  }
}
