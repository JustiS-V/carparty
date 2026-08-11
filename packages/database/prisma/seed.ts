import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { defaultMetrics } from '../../analytics/src/registry/default-metrics';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carparty.local' },
    update: {},
    create: {
      email: 'admin@carparty.local',
      passwordHash: adminPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const workerPassword = await hash('worker123', 10);
  const worker = await prisma.user.upsert({
    where: { email: 'worker@carparty.local' },
    update: {},
    create: {
      email: 'worker@carparty.local',
      passwordHash: workerPassword,
      name: 'Worker Demo',
      role: UserRole.WORKER,
      workerPermissions: {
        create: [
          { module: 'IMPORT', canRead: true, canWrite: true },
          { module: 'DISMANTLE', canRead: true, canWrite: true },
          { module: 'SERVICE', canRead: true, canWrite: true },
          { module: 'SALES', canRead: true, canWrite: true },
        ],
      },
    },
  });

  const clientPassword = await hash('client123', 10);
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@carparty.local' },
    update: {},
    create: {
      email: 'client@carparty.local',
      passwordHash: clientPassword,
      name: 'Client Demo',
      role: UserRole.CLIENT,
      clientProfile: { create: {} },
    },
  });

  for (const metric of defaultMetrics) {
    await prisma.metricDefinition.upsert({
      where: { key: metric.key },
      update: {
        label: metric.label,
        type: metric.type,
        aggregation: metric.aggregation,
        dimensions: metric.dimensions ?? [],
        chartType: metric.chartType ?? 'line',
        module: metric.module ?? null,
      },
      create: {
        key: metric.key,
        label: metric.label,
        type: metric.type,
        aggregation: metric.aggregation,
        dimensions: metric.dimensions ?? [],
        chartType: metric.chartType ?? 'line',
        module: metric.module ?? null,
      },
    });
  }

  const dashboard = await prisma.dashboard.upsert({
    where: { id: 'default-admin-dashboard' },
    update: {},
    create: {
      id: 'default-admin-dashboard',
      name: 'Главный дашборд',
      role: UserRole.SUPER_ADMIN,
      isDefault: true,
      createdBy: admin.id,
      widgets: {
        create: [
          {
            metricKey: 'sales.count',
            chartType: 'bar',
            title: 'Продажи',
            position: { x: 0, y: 0, w: 4, h: 2 },
          },
          {
            metricKey: 'listing.views',
            chartType: 'line',
            title: 'Просмотры объявлений',
            position: { x: 4, y: 0, w: 4, h: 2 },
          },
          {
            metricKey: 'listing.clicks',
            chartType: 'line',
            title: 'Клики',
            position: { x: 8, y: 0, w: 4, h: 2 },
          },
          {
            metricKey: 'import.completed',
            chartType: 'bar',
            title: 'Завершённые пригоны',
            position: { x: 0, y: 2, w: 6, h: 2 },
          },
          {
            metricKey: 'clients.new',
            chartType: 'area',
            title: 'Новые клиенты',
            position: { x: 6, y: 2, w: 6, h: 2 },
          },
        ],
      },
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin:  admin@carparty.local / admin123`);
  console.log(`  Worker: worker@carparty.local / worker123`);
  console.log(`  Client: client@carparty.local / client123`);
  console.log(`  Dashboard: ${dashboard.name}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
