'use client';

import { MetricRegistryEditor } from '@/components/analytics/metric-registry-editor';

export default function AdminMetricsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Управление метриками</h1>
      <p className="mb-8 text-slate-500">
        Добавляйте новые ключи аналитики без деплоя — как Redux store для метрик
      </p>
      <MetricRegistryEditor />
    </div>
  );
}
