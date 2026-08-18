import { createHash } from 'crypto';
import type { ExternalSource, IngestPayload, ParsedListing } from '@carparty/types';

export * from './extractors';
export * from './heuristics';
export * from './parse-listing';
export * from './ua-market';

export function buildContentHash(payload: Pick<IngestPayload, 'source' | 'externalId' | 'rawText'>): string {
  return createHash('sha256')
    .update(`${payload.source}:${payload.externalId}:${payload.rawText.trim()}`)
    .digest('hex');
}

export type { ExternalSource, IngestPayload, ParsedListing };
