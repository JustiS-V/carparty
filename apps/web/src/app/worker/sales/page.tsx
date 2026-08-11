'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function WorkerSalesPage() {
  const [listings, setListings] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api<typeof listings>('/sales/listings').then(setListings).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Продажа</h1>
      <pre className="overflow-auto rounded-xl border bg-white p-4 text-xs">
        {JSON.stringify(listings, null, 2)}
      </pre>
    </div>
  );
}
