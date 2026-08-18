'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, sourceLabel, statusLabel, timeAgo } from '@/lib/admin-labels';

interface Lead {
  id: string;
  source: string;
  status: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  currency?: string | null;
  region?: string | null;
  description?: string | null;
  rawText: string;
  sourceUrl?: string | null;
  links: string[];
  createdAt: string;
  channel?: { name: string; externalId: string } | null;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    const q = params.toString() ? `?${params}` : '';
    api<Lead[]>(`/collectors/leads${q}`).then(setLeads).catch(console.error);
  }, [source, status]);

  async function setLeadStatus(id: string, newStatus: string) {
    await api(`/collectors/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Лиды и объявления</h1>
      <p className="mb-6 text-sm text-slate-500">Мониторинг собранных объявлений с площадок UA</p>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Все источники</option>
          {['TELEGRAM', 'AUTO_RIA', 'OLX_UA', 'FACEBOOK', 'INSTAGRAM', 'MARKETPLACE'].map((s) => (
            <option key={s} value={s}>
              {sourceLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          {['NEW', 'PARSED', 'REVIEW', 'PROMOTED', 'REJECTED', 'DUPLICATE'].map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-slate-500">{leads.length} записей</span>
      </div>

      <div className="overflow-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="p-3">Время</th>
              <th className="p-3">Источник</th>
              <th className="p-3">Авто</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Город</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                  {timeAgo(lead.createdAt)}
                  <div>{formatDate(lead.createdAt)}</div>
                </td>
                <td className="p-3">
                  <div>{sourceLabel(lead.source)}</div>
                  <div className="text-xs text-slate-400">{lead.channel?.name}</div>
                </td>
                <td className="p-3">
                  {[lead.make, lead.model, lead.year].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="p-3">
                  {lead.price
                    ? `${lead.price.toLocaleString()} ${lead.currency ?? ''}`
                    : '—'}
                </td>
                <td className="p-3">{lead.region ?? '—'}</td>
                <td className="p-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {statusLabel(lead.status)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {lead.sourceUrl && (
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border px-2 py-1 text-xs hover:bg-white"
                      >
                        ↗
                      </a>
                    )}
                    {lead.status !== 'PROMOTED' && (
                      <button
                        onClick={() => setLeadStatus(lead.id, 'PROMOTED')}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                      >
                        CRM
                      </button>
                    )}
                    {lead.status !== 'REJECTED' && (
                      <button
                        onClick={() => setLeadStatus(lead.id, 'REJECTED')}
                        className="rounded border px-2 py-1 text-xs text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads.length && (
          <p className="p-8 text-center text-slate-400">Нет объявлений. Запустите collector.</p>
        )}
      </div>
    </div>
  );
}
