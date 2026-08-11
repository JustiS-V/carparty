'use client';

import { CrmModuleList } from '@/components/crm/module-list';

export default function AdminImportPage() {
  return <CrmModuleList module="IMPORT" title="Пригон" endpoint="/import" />;
}
