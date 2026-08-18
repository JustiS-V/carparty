'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface BotStats {
  subscribers: number;
  paid: number;
  deliveries: number;
  orders: number;
  leads: number;
}

interface Subscriber {
  id: string;
  telegramId: string;
  telegramUsername?: string | null;
  firstName?: string | null;
  plan: string;
  expiresAt?: string | null;
  dailySent: number;
  isActive: boolean;
  createdAt: string;
  _count: { deliveries: number };
}

export default function AdminBotPage() {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    api<BotStats>('/bot/stats').then(setStats).catch(console.error);
    api<Subscriber[]>('/bot/subscribers').then(setSubscribers).catch(console.error);
  }, []);

  async function activate(id: string, plan: 'BASIC' | 'PRO') {
    await api(`/bot/subscribers/${id}/activate`, {
      method: 'PATCH',
      body: JSON.stringify({ plan, days: 30 }),
    });
    const updated = await api<Subscriber[]>('/bot/subscribers');
    setSubscribers(updated);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Telegram Bot — UA ринок</h1>
      <p className="mb-8 text-sm text-gray-500">Підписники, оплати та доставки оголошень</p>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ['Підписники', stats.subscribers],
            ['Платні', stats.paid],
            ['Доставки', stats.deliveries],
            ['Оплати', stats.orders],
            ['Ліди UA', stats.leads],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border bg-white p-4">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left">
            <tr>
              <th className="p-3">Користувач</th>
              <th className="p-3">Тариф</th>
              <th className="p-3">До</th>
              <th className="p-3">Сьогодні</th>
              <th className="p-3">Доставок</th>
              <th className="p-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="font-medium">
                    {sub.telegramUsername ? `@${sub.telegramUsername}` : sub.firstName ?? sub.telegramId}
                  </div>
                  <div className="text-xs text-gray-400">{sub.telegramId}</div>
                </td>
                <td className="p-3">{sub.plan}</td>
                <td className="p-3">
                  {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('uk-UA') : '—'}
                </td>
                <td className="p-3">{sub.dailySent}</td>
                <td className="p-3">{sub._count.deliveries}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => activate(sub.id, 'BASIC')}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      BASIC
                    </button>
                    <button
                      onClick={() => activate(sub.id, 'PRO')}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      PRO
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
