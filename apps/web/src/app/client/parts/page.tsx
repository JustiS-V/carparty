'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrackableView } from '@/components/analytics/tracker';

export default function ClientPartsPage() {
  const [parts, setParts] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api<typeof parts>('/dismantle/parts').then(setParts).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Каталог запчастей</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {parts.map((p) => (
          <TrackableView
            key={String(p.id)}
            metric="parts.views"
            dimensions={{ part_id: String(p.id), category: String(p.category) }}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <pre className="text-xs">{JSON.stringify(p, null, 2)}</pre>
            </div>
          </TrackableView>
        ))}
        {parts.length === 0 && <p className="text-slate-500">Запчастей пока нет</p>}
      </div>
    </div>
  );
}
