'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { AuthUser } from '@carparty/types';
import { clearToken } from '@/lib/api';
import { moduleLabels, roleLabels } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

interface SidebarProps {
  user: AuthUser;
  items: NavItem[];
  title: string;
}

export function Sidebar({ user, items, title }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <Link href="/" className="text-xl font-bold text-brand-700">
          CarParty
        </Link>
        <p className="mt-1 text-sm text-slate-500">{title}</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {item.label}
          </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-slate-500">{roleLabels[user.role]}</p>
        <button
          onClick={() => {
            clearToken();
            window.location.href = '/login';
          }}
          className="mt-3 text-sm text-red-600 hover:underline"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}

export function ModuleBadge({ module }: { module: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {moduleLabels[module] ?? module}
    </span>
  );
}
