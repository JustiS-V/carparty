'use client';

import { CrmModuleList } from '@/components/crm/module-list';

export default function WorkerImportPage() {
  return <CrmModuleList module="IMPORT" title="Пригон" endpoint="/import" />;
}
