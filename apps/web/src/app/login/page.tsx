'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuthUser } from '@carparty/types';
import { api, setStoredUser, setToken } from '@/lib/api';
import { getDashboardPath } from '@/lib/utils';

const DEMO_ACCOUNTS = [
  { role: 'Администратор', sees: 'метрики, каналы, бот, пользователи', email: 'admin@carparty.local', password: 'admin123' },
  { role: 'Сотрудник', sees: 'лиды, пригон, разборка, сервис, продажи', email: 'worker@carparty.local', password: 'worker123' },
  { role: 'Клиент', sees: 'свои авто и заявки', email: 'client@carparty.local', password: 'client123' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@carparty.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const signIn = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    // A sleeping free-tier API takes a while to wake up; say so instead of looking frozen.
    const wakeHint = setTimeout(() => setSlow(true), 4000);

    try {
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setToken(res.token);
      setStoredUser(res.user);
      router.push(getDashboardPath(res.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      clearTimeout(wakeHint);
      setSlow(false);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void signIn({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link href="/" className="text-xl font-bold text-brand-700">
          CarParty
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Вход в систему</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {slow && <p className="text-sm text-slate-500">Сервер демо просыпается после простоя — это занимает до минуты.</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-sm font-medium text-slate-700">Демо: войти одной кнопкой</p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => signIn(account)}
                className="flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-left text-sm hover:border-brand-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="font-medium text-slate-800">{account.role}</span>
                <span className="text-xs text-slate-500">{account.sees}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
