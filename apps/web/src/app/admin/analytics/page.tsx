'use client';

import { useEffect, useState } from 'react';
import { AdminDailyCharts } from '@/components/admin/daily-charts';
import { DashboardGrid } from '@/components/analytics/dashboard-grid';
import { api } from '@/lib/api';

interface Dashboard {
  id: string;
  name: string;
  isDefault?: boolean;
  widgets: Array<{ metricKey: string; chartType: string; title: string }>;
}

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [period, setPeriod] = useState('last_30_days');

  useEffect(() => {
    api<Dashboard[]>('/analytics/dashboards?role=SUPER_ADMIN')
      .then((list) => setDashboard(list.find((d) => d.isDefault) ?? list[0] ?? null))
      .catch(console.error);
  }, []);

  const defaultWidgets = [
    { metricKey: 'leads.ingested', chartType: 'area', title: 'Собранные объявления' },
    { metricKey: 'bot.deliveries', chartType: 'area', title: 'Доставки бота' },
    { metricKey: 'bot.revenue', chartType: 'area', title: 'Выручка бота' },
    { metricKey: 'bot.payments', chartType: 'bar', title: 'Оплаты' },
    { metricKey: 'sales.count', chartType: 'bar', title: 'Продажи' },
    { metricKey: 'listing.views', chartType: 'line', title: 'Просмотры' },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-slate-500">Продажи, просмотры, клики и бизнес-метрики</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="today">Сегодня</option>
          <option value="last_7_days">7 дней</option>
          <option value="last_30_days">30 дней</option>
          <option value="last_90_days">90 дней</option>
        </select>
      </div>

      <div className="mb-10">
        <AdminDailyCharts
          days={
            period === 'today' || period === 'last_7_days'
              ? 7
              : period === 'last_90_days'
                ? 90
                : 30
          }
        />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Метрики из event log
      </h2>
      <DashboardGrid
        widgets={dashboard?.widgets ?? defaultWidgets}
        period={period}
      />
    </div>
  );
}
