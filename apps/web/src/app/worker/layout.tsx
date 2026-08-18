'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@carparty/types';
import { getStoredUser } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';

const workerNav = [
  { href: '/worker/dashboard', label: 'Дашборд' },
  { href: '/worker/analytics', label: 'Аналитика' },
  { href: '/worker/leads', label: 'Лиды' },
  { href: '/worker/import', label: 'Пригон' },
  { href: '/worker/dismantle', label: 'Разборка' },
  { href: '/worker/service', label: 'Сервис' },
  { href: '/worker/sales', label: 'Продажа' },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (!stored || (stored.role !== 'WORKER' && stored.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} items={workerNav} title="CRM — Воркер" />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
