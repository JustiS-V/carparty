import type { IngestPayload } from '@carparty/types';
import { ingestLead } from '../api-client';

const SYNC_INTERVAL_MS = Number(process.env.OLX_SYNC_INTERVAL_MS ?? 300_000);
const OLX_CARS_CATEGORY = '84';

const seenIds = new Set<string>();

interface OlxOffer {
  id: number;
  title?: string;
  description?: string;
  url?: string;
  created_time?: string;
  params?: Array<{ key?: string; name?: string; value?: { label?: string } }>;
  location?: { city?: { name?: string }; region?: { name?: string } };
  photos?: Array<{ link?: string }>;
}

interface OlxResponse {
  data?: OlxOffer[];
}

export function startOlxUaCollector(): NodeJS.Timeout | null {
  const tick = () => {
    syncOlxUa().catch((error) => console.error('[olx]', error));
  };

  tick();
  console.log('[olx] OLX.ua collector started');
  return setInterval(tick, SYNC_INTERVAL_MS);
}

async function syncOlxUa(): Promise<void> {
  const params = new URLSearchParams({
    offset: '0',
    limit: '20',
    category_id: OLX_CARS_CATEGORY,
    sort_by: 'created_at:desc',
  });

  const response = await fetch(`https://www.olx.ua/api/v1/offers/?${params}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CarParty-Collector/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`OLX fetch failed: ${response.status}`);
  }

  const body = (await response.json()) as OlxResponse;
  const offers = body.data ?? [];

  for (const offer of offers) {
    const externalId = `olx_${offer.id}`;
    if (seenIds.has(externalId)) continue;

    const price = extractOlxPrice(offer);
    const payload: IngestPayload = {
      source: 'OLX_UA',
      externalId,
      rawText: buildOlxText(offer, price),
      sourceUrl: offer.url ?? `https://www.olx.ua/d/uk/obyavlenie/id-${offer.id}.html`,
      channelExternalId: 'olx.ua',
      channelName: 'OLX.ua',
      mediaUrls: (offer.photos ?? []).map((p) => p.link).filter(Boolean) as string[],
      metadata: {
        olxId: offer.id,
        city: offer.location?.city?.name,
        region: offer.location?.region?.name,
        price,
      },
      postedAt: offer.created_time,
    };

    const result = await ingestLead(payload);
    if (!result.duplicate) {
      seenIds.add(externalId);
      console.log(`[olx] ingested ${externalId}`);
    }
  }
}

function extractOlxPrice(offer: OlxOffer): string | null {
  const priceParam = offer.params?.find(
    (p) => p.key === 'price' || p.name?.toLowerCase().includes('ціна'),
  );
  return priceParam?.value?.label ?? null;
}

function buildOlxText(offer: OlxOffer, price: string | null): string {
  const parts = [
    offer.title,
    price ? `Ціна: ${price}` : null,
    offer.location?.city?.name ? `Місто: ${offer.location.city.name}` : null,
    offer.location?.region?.name ? `Область: ${offer.location.region.name}` : null,
    offer.description,
    offer.url,
  ].filter(Boolean);

  return parts.join('\n');
}
