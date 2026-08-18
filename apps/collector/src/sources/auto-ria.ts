import type { IngestPayload } from '@carparty/types';
import { ingestLead } from '../api-client';

const API_KEY = process.env.AUTORIA_API_KEY ?? '';
const BASE = 'https://developers.ria.com/auto';
const SYNC_INTERVAL_MS = Number(process.env.AUTORIA_SYNC_INTERVAL_MS ?? 300_000);

const seenIds = new Set<string>();

interface SearchResponse {
  result?: {
    search_result?: {
      ids?: number[];
      count?: number;
    };
  };
}

interface InfoResponse {
  auto?: {
    id?: number;
    markName?: string;
    modelName?: string;
    year?: number;
    price?: number;
    currency?: { name?: string };
    description?: string;
    linkToView?: string;
    cityName?: string;
    stateName?: string;
  };
}

export function startAutoRiaCollector(): NodeJS.Timeout | null {
  if (!API_KEY) {
    console.log('[autoria] Пропуск: задайте AUTORIA_API_KEY (developers.ria.com)');
    return null;
  }

  const tick = () => {
    syncAutoRia().catch((error) => console.error('[autoria]', error));
  };

  tick();
  return setInterval(tick, SYNC_INTERVAL_MS);
}

async function syncAutoRia(): Promise<void> {
  const params = new URLSearchParams({
    api_key: API_KEY,
    category_id: '1',
    status_id: '0',
    searchType: '4',
    countpage: '20',
    page: '0',
    'sellingType[0]': '1',
  });

  const response = await fetch(`${BASE}/search?${params}`);
  if (!response.ok) {
    throw new Error(`AUTO.RIA search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchResponse;
  const ids = data.result?.search_result?.ids ?? [];

  for (const id of ids) {
    const externalId = `autoria_${id}`;
    if (seenIds.has(externalId)) continue;

    const info = await fetchListingInfo(id);
    if (!info) continue;

    const payload: IngestPayload = {
      source: 'AUTO_RIA',
      externalId,
      rawText: buildListingText(info),
      sourceUrl: info.linkToView ?? `https://auto.ria.com/auto___${id}.html`,
      channelExternalId: 'auto.ria.com',
      channelName: 'AUTO.RIA',
      metadata: {
        autoRiaId: id,
        city: info.cityName,
        state: info.stateName,
      },
    };

    const result = await ingestLead(payload);
    if (!result.duplicate) {
      seenIds.add(externalId);
      console.log(`[autoria] ingested ${externalId}`);
    }
  }
}

async function fetchListingInfo(id: number): Promise<InfoResponse['auto'] | null> {
  const params = new URLSearchParams({ api_key: API_KEY, auto_id: String(id) });
  const response = await fetch(`${BASE}/info?${params}`);
  if (!response.ok) return null;

  const data = (await response.json()) as InfoResponse;
  return data.auto ?? null;
}

function buildListingText(info: NonNullable<InfoResponse['auto']>): string {
  const parts = [
    [info.markName, info.modelName, info.year].filter(Boolean).join(' '),
    info.price ? `Ціна: ${info.price} ${info.currency?.name ?? 'USD'}` : null,
    info.cityName ? `Місто: ${info.cityName}` : null,
    info.stateName ? `Область: ${info.stateName}` : null,
    info.description,
    info.linkToView,
  ].filter(Boolean);

  return parts.join('\n');
}
