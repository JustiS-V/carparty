'use client';

import { CrmModuleList } from '@/components/crm/module-list';

export default function AdminServicePage() {
  return <CrmModuleList module="SERVICE" title="Сервис" endpoint="/service" />;
}
