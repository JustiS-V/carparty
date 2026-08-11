'use client';

import { CrmModuleList } from '@/components/crm/module-list';

export default function WorkerDismantlePage() {
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
