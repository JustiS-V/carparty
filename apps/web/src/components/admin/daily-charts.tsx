'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { formatUah, sourceLabel } from '@/lib/admin-labels';

interface DailyPoint {
  date: string;
  value: number;
}

interface DailyAnalytics {
  days: number;
  leads: DailyPoint[];
  deliveries: DailyPoint[];
  payments: DailyPoint[];
  revenue: DailyPoint[];
  subscribers: DailyPoint[];
  leadsBySource: Array<{ date: string; source: string; value: number }>;
  totals: {
    leads: number;
    deliveries: number;
    payments: number;
    revenueUah: number;
    subscribers: number;
  };
}

const SOURCE_COLORS: Record<string, string> = {
  TELEGRAM: '#2563eb',
  AUTO_RIA: '#16a34a',
  OLX_UA: '#ea580c',
  FACEBOOK: '#7c3aed',
  INSTAGRAM: '#db2777',
  MARKETPLACE: '#0891b2',
  OTHER: '#64748b',
};

function formatChartDate(date: string) {
  const [, month, day] = date.split('-');
  return `${day}.${month}`;
}

interface AdminDailyChartsProps {
  days?: number;
}

export function AdminDailyCharts({ days = 30 }: AdminDailyChartsProps) {
  const [data, setData] = useState<DailyAnalytics | null>(null);
  const [period, setPeriod] = useState(days);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<DailyAnalytics>(`/admin/analytics/daily?days=${period}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const sourceChartData = useMemo(() => {
    if (!data) return [];
    const sources = [...new Set(data.leadsBySource.map((r) => r.source))];
    const byDate = new Map<string, Record<string, number>>();

    for (const row of data.leadsBySource) {
      const existing = byDate.get(row.date) ?? {};
      existing[row.source] = row.value;
      byDate.set(row.date, existing);
    }

    return data.leads.map((point) => {
      const row: Record<string, string | number> = {
        date: formatChartDate(point.date),
        rawDate: point.date,
      };
      for (const source of sources) {
        row[source] = byDate.get(point.date)?.[source] ?? 0;
      }
      return row;
    });
  }, [data]);

  const sourceKeys = useMemo(
    () => [...new Set(data?.leadsBySource.map((r) => r.source) ?? [])],
    [data],
  );

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Завантаження графіків…</p>;
  }

  if (!data) return null;

  const leadsData = data.leads.map((p) => ({ date: formatChartDate(p.date), value: p.value }));
  const deliveriesData = data.deliveries.map((p) => ({
    date: formatChartDate(p.date),
    value: p.value,
  }));
  const revenueData = data.revenue.map((p) => ({
    date: formatChartDate(p.date),
    value: p.value,
  }));
  const subsData = data.subscribers.map((p) => ({
    date: formatChartDate(p.date),
    value: p.value,
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Аналитика по дням
        </h2>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Лиды', data.totals.leads, 'blue'],
          ['Доставки', data.totals.deliveries, 'purple'],
          ['Оплаты', data.totals.payments, 'green'],
          ['Выручка', formatUah(data.totals.revenueUah), 'orange'],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border bg-white p-3 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-slate-400">за {period} дн.</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Собранные объявления" total={data.totals.leads}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Доставки бота" total={data.totals.deliveries}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={deliveriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Выручка (UAH)" total={formatUah(data.totals.revenueUah)}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatUah(v)} />
              <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Новые подписчики" total={data.totals.subscribers}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={subsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {sourceKeys.length > 0 && (
        <ChartCard title="Лиды по источникам" total={data.totals.leads}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sourceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend formatter={(value) => sourceLabel(value)} />
              {sourceKeys.map((source) => (
                <Bar
                  key={source}
                  dataKey={source}
                  stackId="sources"
                  fill={SOURCE_COLORS[source] ?? '#64748b'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </section>
  );
}

function ChartCard({
  title,
  total,
  children,
}: {
  title: string;
  total: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-slate-800">{title}</h3>
        <span className="text-sm text-slate-500">Σ {total}</span>
      </div>
      {children}
    </div>
  );
}
