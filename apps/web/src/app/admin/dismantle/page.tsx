'use client';

import { CrmModuleList } from '@/components/crm/module-list';

export default function AdminDismantlePage() {
  return (
    <CrmModuleList
      module="DISMANTLE"
      title="Разборка"
      endpoint="/dismantle"
      secondaryEndpoint="/dismantle/parts"
      secondaryLabel="Запчасти"
    />
  );
}
