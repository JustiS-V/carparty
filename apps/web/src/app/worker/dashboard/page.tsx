'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function WorkerDashboardPage() {
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; module: string; isDone: boolean }>>([]);

  useEffect(() => {
    api<typeof tasks>('/tasks').then(setTasks).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Дашборд воркера</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Задачи</h2>
          <ul className="mt-4 space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>{t.title}</span>
                <span className={t.isDone ? 'text-green-600' : 'text-orange-600'}>
                  {t.isDone ? 'Готово' : 'В работе'}
                </span>
              </li>
            ))}
            {tasks.length === 0 && <p className="text-sm text-slate-500">Задач нет</p>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Модули CRM</h2>
          <p className="mt-2 text-sm text-slate-500">
            Пригон, разборка, сервис и продажа — в боковом меню
          </p>
        </div>
      </div>
    </div>
  );
}
