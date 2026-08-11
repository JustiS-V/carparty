'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>>([]);

  useEffect(() => {
    api<typeof users>('/users').then(setUsers).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Пользователи</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.isActive ? 'Активен' : 'Неактивен'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
