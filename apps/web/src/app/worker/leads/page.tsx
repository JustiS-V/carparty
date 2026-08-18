'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ExternalLead {
  id: string;
  source: string;
  sourceUrl?: string | null;
  description?: string | null;
  rawText: string;
  price?: number | null;
  currency?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  links: string[];
  status: string;
  createdAt: string;
  channel?: { name: string; externalId: string } | null;
}

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  PARSED: 'Разобран',
  REVIEW: 'На проверке',
  PROMOTED: 'В CRM',
  REJECTED: 'Отклонён',
  DUPLICATE: 'Дубликат',
};

const sourceLabels: Record<string, string> = {
  TELEGRAM: 'Telegram',
  THREADS: 'Threads',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  MARKETPLACE: 'Площадка',
  OTHER: 'Другое',
};

export default function WorkerLeadsPage() {
  const [leads, setLeads] = useState<ExternalLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const query = filter ? `?status=${filter}` : '';
    api<ExternalLead[]>(`/collectors/leads${query}`)
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    await api(`/collectors/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Лиды с площадок</h1>
          <p className="mt-1 text-sm text-gray-500">
            Telegram, Instagram, Facebook, Threads и маркетплейсы
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Пока нет собранных объявлений. Запустите collector для Telegram-каналов.
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-xl border bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {sourceLabels[lead.source] ?? lead.source}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                  {statusLabels[lead.status] ?? lead.status}
                </span>
                {lead.channel && (
                  <span className="text-xs text-gray-500">{lead.channel.name}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(lead.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>

              {(lead.make || lead.model || lead.year || lead.price) && (
                <div className="mb-2 flex flex-wrap gap-3 text-sm">
                  {lead.make && <span className="font-medium">{lead.make}</span>}
                  {lead.model && <span>{lead.model}</span>}
                  {lead.year && <span>{lead.year} г.</span>}
                  {lead.price && (
                    <span className="font-semibold text-green-700">
                      {lead.price.toLocaleString('ru-RU')} {lead.currency ?? 'USD'}
                    </span>
                  )}
                </div>
              )}

              <p className="mb-3 whitespace-pre-wrap text-sm text-gray-800 line-clamp-4">
                {lead.description ?? lead.rawText}
              </p>

              {Array.isArray(lead.links) && lead.links.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {lead.links.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-blue-600 hover:underline max-w-xs"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {lead.sourceUrl && (
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                  >
                    Открыть источник
                  </a>
                )}
                {lead.status !== 'PROMOTED' && (
                  <button
                    onClick={() => updateStatus(lead.id, 'PROMOTED')}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                  >
                    В CRM
                  </button>
                )}
                {lead.status !== 'REJECTED' && (
                  <button
                    onClick={() => updateStatus(lead.id, 'REJECTED')}
                    className="rounded-lg border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Отклонить
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
