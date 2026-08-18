'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@carparty/types';
import { getStoredUser } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';

const adminNav = [
  { href: '/admin', label: 'Мониторинг' },
  { href: '/admin/leads', label: 'Лиды' },
  { href: '/admin/channels', label: 'Каналы' },
  { href: '/admin/bot', label: 'Telegram Bot' },
  { href: '/admin/analytics', label: 'Аналитика' },
  { href: '/admin/metrics', label: 'Метрики' },
  { href: '/admin/users', label: 'Пользователи' },
  { href: '/admin/import', label: 'Пригон' },
  { href: '/admin/dismantle', label: 'Разборка' },
  { href: '/admin/service', label: 'Сервис' },
  { href: '/admin/sales', label: 'Продажа' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (!stored || stored.role !== 'SUPER_ADMIN') {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} items={adminNav} title="Панель администратора" />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
