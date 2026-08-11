'use client';

import { useEffect, useState } from 'react';
import type { MetricDefinition } from '@carparty/types';
import { api } from '@/lib/api';

interface MetricRegistryEditorProps {
  onRegistered?: () => void;
}

export function MetricRegistryEditor({ onRegistered }: MetricRegistryEditorProps) {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [form, setForm] = useState({
    key: '',
    label: '',
    type: 'counter',
    aggregation: 'sum',
    chartType: 'line',
    module: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api<MetricDefinition[]>('/analytics/metrics')
      .then(setMetrics)
      .catch(console.error);
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api('/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          module: form.module || undefined,
        }),
      });
      setForm({ key: '', label: '', type: 'counter', aggregation: 'sum', chartType: 'line', module: '' });
      load();
      onRegistered?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Добавить метрику</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input
            required
            placeholder="Ключ (sales.telegram_leads)"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Название"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="counter">counter</option>
            <option value="gauge">gauge</option>
            <option value="rate">rate</option>
            <option value="histogram">histogram</option>
          </select>
          <select
            value={form.aggregation}
            onChange={(e) => setForm({ ...form, aggregation: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="sum">sum</option>
            <option value="count">count</option>
            <option value="avg">avg</option>
            <option value="max">max</option>
            <option value="min">min</option>
          </select>
          <select
            value={form.chartType}
            onChange={(e) => setForm({ ...form, chartType: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="line">line</option>
            <option value="bar">bar</option>
            <option value="area">area</option>
            <option value="pie">pie</option>
            <option value="number">number</option>
          </select>
          <input
            placeholder="Модуль (SALES, IMPORT...)"
            value={form.module}
            onChange={(e) => setForm({ ...form, module: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Добавить ключ'}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Зарегистрированные метрики</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Ключ</th>
                <th className="pb-2 pr-4">Название</th>
                <th className="pb-2 pr-4">Тип</th>
                <th className="pb-2 pr-4">График</th>
                <th className="pb-2">Модуль</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-mono text-xs">{m.key}</td>
                  <td className="py-2 pr-4">{m.label}</td>
                  <td className="py-2 pr-4">{m.type}</td>
                  <td className="py-2 pr-4">{m.chartType}</td>
                  <td className="py-2">{m.module ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
