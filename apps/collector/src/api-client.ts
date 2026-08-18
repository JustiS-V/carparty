import type { IngestPayload } from '@carparty/types';

const API_URL = process.env.COLLECTOR_API_URL ?? 'http://localhost:4000/api';
const API_KEY = process.env.COLLECTOR_API_KEY ?? '';

export async function ingestLead(payload: IngestPayload): Promise<{ duplicate: boolean }> {
  if (!API_KEY) {
    throw new Error('COLLECTOR_API_KEY is required');
  }

  const response = await fetch(`${API_URL}/collectors/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-collector-key': API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { duplicate?: boolean };
  return { duplicate: Boolean(data.duplicate) };
}
