import type { AuthUser } from '@carparty/types';

export function getDashboardPath(role: AuthUser['role']): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/analytics';
    case 'WORKER':
      return '/worker/dashboard';
    case 'CLIENT':
    default:
      return '/client/dashboard';
  }
}

export const moduleLabels: Record<string, string> = {
  IMPORT: 'Пригон',
  DISMANTLE: 'Разборка',
  SERVICE: 'Сервис',
  SALES: 'Продажа',
};

export const roleLabels: Record<string, string> = {
  CLIENT: 'Клиент',
  WORKER: 'Воркер',
  SUPER_ADMIN: 'Админ',
};
