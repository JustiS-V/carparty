#!/usr/bin/env tsx
/**
 * Smoke-тест: ingest → API → перевірка відповіді.
 * Запуск: pnpm smoke (API має бути запущений, COLLECTOR_API_KEY в .env)
 */
import 'dotenv/config';

const API_URL = process.env.COLLECTOR_API_URL ?? process.env.SMOKE_API_URL ?? 'http://localhost:4000/api';
const API_KEY = process.env.COLLECTOR_API_KEY ?? '';

const samplePayload = {
  source: 'TELEGRAM',
  externalId: `smoke_${Date.now()}`,
  rawText: [
    'Продам BMW X5 2019',
    'Ціна: 28500 USD',
    'Київ',
    'https://auto.ria.com/auto___123.html',
    'Copart, пробіг 45000 км',
  ].join('\n'),
  sourceUrl: 'https://t.me/test/1',
  channelExternalId: '@smoke_test',
  channelName: 'Smoke Test UA',
  metadata: { smoke: true },
};

async function main() {
  if (!API_KEY) {
    console.error('❌ COLLECTOR_API_KEY не задано');
    process.exit(1);
  }

  console.log(`→ POST ${API_URL}/collectors/ingest`);

  const response = await fetch(`${API_URL}/collectors/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-collector-key': API_KEY,
    },
    body: JSON.stringify(samplePayload),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`❌ Ingest failed (${response.status}):`, body);
    process.exit(1);
  }

  const data = JSON.parse(body) as { duplicate?: boolean; lead?: { id: string; make?: string; region?: string } };
  console.log('✅ Ingest OK');
  console.log(`   duplicate: ${data.duplicate}`);
  if (data.lead) {
    console.log(`   lead id: ${data.lead.id}`);
    console.log(`   make: ${data.lead.make ?? '—'}, region: ${data.lead.region ?? '—'}`);
  }

  const health = await fetch(`${API_URL.replace('/api', '')}/api/collectors/leads`, {
    headers: { Authorization: 'Bearer skip' },
  }).catch(() => null);

  if (health?.status === 401) {
    console.log('✅ API доступний (leads endpoint захищений JWT — очікувано)');
  }

  console.log('\nSmoke test passed.');
}

main().catch((error) => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});
