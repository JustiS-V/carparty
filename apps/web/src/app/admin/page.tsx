'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminDailyCharts } from '@/components/admin/daily-charts';
import { StatCard } from '@/components/admin/stat-card';
import { api } from '@/lib/api';
import { formatDate, formatUah, sourceLabel, statusLabel, timeAgo } from '@/lib/admin-labels';

interface Overview {
  generatedAt: string;
  bot: {
    subscribers: number;
    paid: number;
    deliveries: number;
    ordersPaid: number;
    revenueUah: number;
  };
  collectors: {
    totalLeads: number;
    todayLeads: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    channels: Array<{
      id: string;
      name: string;
      source: string;
      externalId: string;
      isActive: boolean;
      lastSyncAt: string | null;
      leadsCount: number;
    }>;
  };
  crm: {
    imports: { total: number; active: number };
    sales: { listed: number; sold: number };
    serviceOrders: number;
    dismantleJobs: number;
    users: { total: number; workers: number; clients: number };
    openTasks: number;
  };
  recent: {
    leads: Array<{
      id: string;
      source: string;
      status: string;
      make?: string | null;
      model?: string | null;
      price?: number | null;
      region?: string | null;
      createdAt: string;
      channel?: { name: string } | null;
    }>;
    deliveries: Array<{
      sentAt: string;
      subscriber?: { telegramUsername?: string | null; plan: string };
      lead?: { source: string; make?: string | null; model?: string | null };
    }>;
    payments: Array<{
      orderId: string;
      plan: string;
      amountUah: number;
      status: string;
      createdAt: string;
    }>;
  };
}

interface Health {
  status: string;
  database: string;
  latencyMs: number;
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, healthData] = await Promise.all([
        api<Overview>('/admin/overview'),
        api<Health>('/admin/health'),
      ]);
      setOverview(data);
      setHealth(healthData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !overview) {
    return <p className="text-slate-500">Завантаження моніторингу…</p>;
  }

  if (error && !overview) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
        <button onClick={load} className="ml-4 underline">
          Повторити
        </button>
      </div>
    );
  }

  if (!overview) return null;

  const maxSourceCount = Math.max(...Object.values(overview.collectors.bySource), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Мониторинг проекта</h1>
          <p className="mt-1 text-sm text-slate-500">
            Оновлено: {formatDate(overview.generatedAt)}
            {health && (
              <span className="ml-3 inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                API {health.latencyMs}ms
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
        >
          Оновити
        </button>
      </div>

      <AdminDailyCharts days={30} />

      {/* Bot & Revenue */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Telegram Bot · UA
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Подписчики" value={overview.bot.subscribers} accent="blue" />
          <StatCard label="Платные" value={overview.bot.paid} accent="green" hint="BASIC + PRO" />
          <StatCard label="Доставки" value={overview.bot.deliveries} accent="purple" />
          <StatCard label="Оплаты" value={overview.bot.ordersPaid} accent="orange" />
          <StatCard
            label="Выручка"
            value={formatUah(overview.bot.revenueUah)}
            accent="green"
          />
        </div>
      </section>

      {/* Collectors */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Сбор объявлений
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Всего лидов UA"
            value={overview.collectors.totalLeads}
            trend={`+${overview.collectors.todayLeads} сегодня`}
            accent="blue"
          />
          <StatCard
            label="Каналов"
            value={overview.collectors.channels.length}
            hint={`активных: ${overview.collectors.channels.filter((c) => c.isActive).length}`}
          />
          <StatCard label="На проверке" value={overview.collectors.byStatus.REVIEW ?? 0} accent="orange" />
          <StatCard label="В CRM" value={overview.collectors.byStatus.PROMOTED ?? 0} accent="green" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">По источникам</h3>
              <Link href="/admin/leads" className="text-xs text-blue-600 hover:underline">
                Все лиды →
              </Link>
            </div>
            <div className="space-y-2">
              {Object.entries(overview.collectors.bySource).map(([source, count]) => (
                <div key={source}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{sourceLabel(source)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {!Object.keys(overview.collectors.bySource).length && (
                <p className="text-sm text-slate-400">Нет данных — запустите collector</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Каналы</h3>
              <Link href="/admin/channels" className="text-xs text-blue-600 hover:underline">
                Управление →
              </Link>
            </div>
            <div className="max-h-48 space-y-2 overflow-auto">
              {overview.collectors.channels.slice(0, 6).map((ch) => (
                <div key={ch.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{ch.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{sourceLabel(ch.source)}</span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>{ch.leadsCount} лидов</div>
                    <div>{ch.lastSyncAt ? timeAgo(ch.lastSyncAt) : 'не синх.'}</div>
                  </div>
                </div>
              ))}
              {!overview.collectors.channels.length && (
                <p className="text-sm text-slate-400">Каналы появятся после первого ingest</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CRM */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">CRM</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Пригоны" value={overview.crm.imports.active} hint={`из ${overview.crm.imports.total}`} />
          <StatCard label="В продаже" value={overview.crm.sales.listed} />
          <StatCard label="Продано" value={overview.crm.sales.sold} accent="green" />
          <StatCard label="Сервис" value={overview.crm.serviceOrders} />
          <StatCard label="Разборка" value={overview.crm.dismantleJobs} />
          <StatCard label="Пользователи" value={overview.crm.users.total} hint={`${overview.crm.users.clients} клиентов`} />
          <StatCard label="Задачи" value={overview.crm.openTasks} accent="orange" />
        </div>
      </section>

      {/* Activity feed */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Последние объявления</h3>
            <Link href="/admin/leads" className="text-xs text-blue-600 hover:underline">
              Все →
            </Link>
          </div>
          <div className="space-y-3">
            {overview.recent.leads.map((lead) => (
              <div key={lead.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{sourceLabel(lead.source)}</span>
                    <span className="text-xs text-slate-400">{statusLabel(lead.status)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {[lead.make, lead.model].filter(Boolean).join(' ') || 'Без марки'}
                    {lead.price ? ` · ${lead.price.toLocaleString()} USD` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.region ?? 'UA'}
                    {lead.channel ? ` · ${lead.channel.name}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{timeAgo(lead.createdAt)}</span>
              </div>
            ))}
            {!overview.recent.leads.length && (
              <p className="text-sm text-slate-400">Объявлений пока нет</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Доставки бота</h3>
              <Link href="/admin/bot" className="text-xs text-blue-600 hover:underline">
                Бот →
              </Link>
            </div>
            <div className="space-y-2">
              {overview.recent.deliveries.map((d, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">
                    @{d.subscriber?.telegramUsername ?? 'user'}
                  </span>
                  <span className="text-slate-500">
                    {' '}
                    · {[d.lead?.make, d.lead?.model].filter(Boolean).join(' ') || sourceLabel(d.lead?.source ?? '')}
                  </span>
                  <div className="text-xs text-slate-400">{timeAgo(d.sentAt)}</div>
                </div>
              ))}
              {!overview.recent.deliveries.length && (
                <p className="text-sm text-slate-400">Доставок пока нет</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-medium">Последние оплаты</h3>
            <div className="space-y-2">
              {overview.recent.payments.map((p) => (
                <div key={p.orderId} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{p.plan}</span>
                    <span className={`ml-2 text-xs ${p.status === 'paid' ? 'text-green-600' : 'text-slate-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  <span>{formatUah(p.amountUah)}</span>
                </div>
              ))}
              {!overview.recent.payments.length && (
                <p className="text-sm text-slate-400">Оплат пока нет</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
