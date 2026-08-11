'use client';

import { useEffect, useState } from 'react';
import type { AnalyticsQueryResult } from '@carparty/types';
import { api } from '@/lib/api';
import { MetricCard } from './metric-chart';

interface DashboardGridProps {
  widgets: Array<{ metricKey: string; chartType: string; title: string }>;
  period?: string;
}

export function DashboardGrid({ widgets, period = 'last_30_days' }: DashboardGridProps) {
  const [results, setResults] = useState<Record<string, AnalyticsQueryResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data: Record<string, AnalyticsQueryResult> = {};

      await Promise.all(
        widgets.map(async (w) => {
          try {
            const result = await api<AnalyticsQueryResult>(
              `/analytics/query?metric=${encodeURIComponent(w.metricKey)}&period=${period}&groupBy=day`,
            );
            data[w.metricKey] = { ...result, chartType: (w.chartType as AnalyticsQueryResult['chartType']) ?? result.chartType };
          } catch {
            data[w.metricKey] = {
              metric: w.metricKey,
              label: w.title,
              chartType: w.chartType as AnalyticsQueryResult['chartType'],
              data: [],
              total: 0,
            };
          }
        }),
      );

      setResults(data);
      setLoading(false);
    }

    load();
  }, [widgets, period]);

  if (loading) {
    return <p className="text-slate-500">Загрузка аналитики...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {widgets.map((w) => (
        <MetricCard
          key={w.metricKey}
          title={w.title}
          result={
            results[w.metricKey] ?? {
              metric: w.metricKey,
              label: w.title,
              chartType: w.chartType as AnalyticsQueryResult['chartType'],
              data: [],
              total: 0,
            }
          }
        />
      ))}
    </div>
  );
}
