'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@carparty/types';
import { getStoredUser } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';

const clientNav = [
  { href: '/client/dashboard', label: 'Мои заявки' },
  { href: '/client/import', label: 'Пригон' },
  { href: '/client/parts', label: 'Запчасти' },
  { href: '/client/service', label: 'Сервис' },
  { href: '/client/sales', label: 'Авто в продаже' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (!stored || stored.role !== 'CLIENT') {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} items={clientNav} title="Личный кабинет" />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
