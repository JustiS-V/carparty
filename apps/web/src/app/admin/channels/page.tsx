'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, sourceLabel, timeAgo } from '@/lib/admin-labels';

interface Channel {
  id: string;
  source: string;
  externalId: string;
  name: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  _count: { leads: number };
}

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [source, setSource] = useState('TELEGRAM');

  const load = () => api<Channel[]>('/collectors/channels').then(setChannels).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    await api('/collectors/channels', {
      method: 'POST',
      body: JSON.stringify({ source, externalId, name: name || externalId }),
    });
    setName('');
    setExternalId('');
    load();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await api(`/collectors/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  const activeCount = channels.filter((c) => c.isActive).length;
  const staleCount = channels.filter((c) => {
    if (!c.lastSyncAt) return true;
    return Date.now() - new Date(c.lastSyncAt).getTime() > 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Каналы сбора</h1>
      <p className="mb-6 text-sm text-slate-500">
        Telegram, AUTO.RIA, OLX — {activeCount} активных
        {staleCount > 0 && `, ${staleCount} без синхронизации >24ч`}
      </p>

      <form onSubmit={addChannel} className="mb-8 flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="TELEGRAM">Telegram</option>
          <option value="AUTO_RIA">AUTO.RIA</option>
          <option value="OLX_UA">OLX.ua</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="INSTAGRAM">Instagram</option>
        </select>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder="@channel или ID"
          className="rounded-lg border px-3 py-2 text-sm"
          required
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Добавить
        </button>
      </form>

      <div className="overflow-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="p-3">Канал</th>
              <th className="p-3">Источник</th>
              <th className="p-3">Лидов</th>
              <th className="p-3">Последняя синх.</th>
              <th className="p-3">Статус</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch) => {
              const stale =
                !ch.lastSyncAt ||
                Date.now() - new Date(ch.lastSyncAt).getTime() > 24 * 60 * 60 * 1000;
              return (
                <tr key={ch.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{ch.name}</div>
                    <div className="text-xs text-slate-400">{ch.externalId}</div>
                  </td>
                  <td className="p-3">{sourceLabel(ch.source)}</td>
                  <td className="p-3 font-medium">{ch._count.leads}</td>
                  <td className="p-3">
                    {ch.lastSyncAt ? (
                      <span className={stale ? 'text-orange-600' : 'text-green-600'}>
                        {timeAgo(ch.lastSyncAt)}
                      </span>
                    ) : (
                      <span className="text-slate-400">никогда</span>
                    )}
                    <div className="text-xs text-slate-400">{formatDate(ch.lastSyncAt)}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ch.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ch.isActive ? 'активен' : 'выкл'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(ch.id, ch.isActive)}
                      className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      {ch.isActive ? 'Выключить' : 'Включить'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!channels.length && (
          <p className="p-8 text-center text-slate-400">
            Каналы появятся после ingest или добавьте вручную
          </p>
        )}
      </div>
    </div>
  );
}
