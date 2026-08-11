'use client';

import { DashboardGrid } from '@/components/analytics/dashboard-grid';

export default function WorkerAnalyticsPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Аналитика</h1>
      <DashboardGrid
        period="last_7_days"
        widgets={[
          { metricKey: 'sales.count', chartType: 'bar', title: 'Продажи' },
          { metricKey: 'listing.views', chartType: 'line', title: 'Просмотры' },
          { metricKey: 'listing.clicks', chartType: 'line', title: 'Клики' },
          { metricKey: 'import.completed', chartType: 'bar', title: 'Пригоны' },
        ]}
      />
    </div>
  );
}
