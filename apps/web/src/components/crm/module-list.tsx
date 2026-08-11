'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ModuleBadge } from '@/components/layout/sidebar';

interface CrmModuleListProps {
  module: string;
  title: string;
  endpoint: string;
  secondaryEndpoint?: string;
  secondaryLabel?: string;
}

export function CrmModuleList({
  module,
  title,
  endpoint,
  secondaryEndpoint,
  secondaryLabel,
}: CrmModuleListProps) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [secondary, setSecondary] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<'main' | 'secondary'>('main');

  useEffect(() => {
    api<typeof items>(endpoint).then(setItems).catch(console.error);
    if (secondaryEndpoint) {
      api<typeof secondary>(secondaryEndpoint).then(setSecondary).catch(console.error);
    }
  }, [endpoint, secondaryEndpoint]);

  const data = tab === 'main' ? items : secondary;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <ModuleBadge module={module} />
      </div>

      {secondaryEndpoint && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab('main')}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'main' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}
          >
            {title}
          </button>
          <button
            onClick={() => setTab('secondary')}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'secondary' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}
          >
            {secondaryLabel}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {data.length === 0 ? (
          <p className="p-6 text-slate-500">Записей пока нет</p>
        ) : (
          <pre className="overflow-auto p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
