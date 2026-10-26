// Demo data for local runs and screenshots: listings, vehicles in every pipeline stage, deals, tasks, bot subscribers and 30 days of analytics. Run after the base seed: pnpm db:seed:demo
import { PrismaClient, ExternalSource, LeadStatus, VehicleStatus, ImportStatus, DismantleStatus, ServiceStatus, SaleStatus, CrmModule, BotPlan } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const day = 86400000;
const ago = (d: number, h = 10) => new Date(Date.now() - d * day + h * 3600000 - 12 * 3600000);
const rnd = (a: number, b: number) => Math.round(a + Math.random() * (b - a));

const cars: [string, string, number, number, string][] = [
  ['Volkswagen', 'Passat B8', 2017, 14200, 'Київ'], ['Toyota', 'RAV4', 2019, 27500, 'Львів'], ['Skoda', 'Octavia A7', 2016, 11800, 'Дніпро'],
  ['BMW', 'X5 F15', 2015, 25900, 'Одеса'], ['Audi', 'A6 C7', 2014, 15400, 'Харків'], ['Hyundai', 'Tucson', 2020, 23100, 'Київ'],
  ['Renault', 'Megane IV', 2018, 10900, 'Вінниця'], ['Mazda', 'CX-5', 2018, 19800, 'Запоріжжя'], ['Kia', 'Sportage', 2019, 20500, 'Полтава'],
  ['Mercedes-Benz', 'E 220d W213', 2017, 29900, 'Київ'], ['Nissan', 'Leaf', 2018, 12300, 'Львів'], ['Ford', 'Kuga', 2017, 13900, 'Дніпро'],
  ['Tesla', 'Model 3', 2019, 24700, 'Київ'], ['Volkswagen', 'Golf VII', 2016, 10200, 'Івано-Франківськ'], ['Toyota', 'Camry 70', 2018, 22600, 'Одеса'],
  ['Honda', 'CR-V', 2017, 18900, 'Харків'], ['Skoda', 'Kodiaq', 2019, 26400, 'Чернівці'], ['Lexus', 'RX 350', 2016, 31500, 'Київ'],
  ['Peugeot', '3008', 2018, 16800, 'Рівне'], ['Mitsubishi', 'Outlander', 2017, 15900, 'Житомир'], ['Chevrolet', 'Volt', 2017, 13100, 'Луцьк'],
  ['Subaru', 'Forester', 2016, 12900, 'Тернопіль'], ['Volvo', 'XC60', 2018, 28300, 'Київ'], ['Opel', 'Insignia B', 2018, 13700, 'Херсон'],
];
const sources = [ExternalSource.OLX_UA, ExternalSource.AUTO_RIA, ExternalSource.TELEGRAM, ExternalSource.MARKETPLACE];
const statuses = [LeadStatus.NEW, LeadStatus.NEW, LeadStatus.PARSED, LeadStatus.REVIEW, LeadStatus.PROMOTED, LeadStatus.REJECTED, LeadStatus.DUPLICATE];

async function main() {
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@carparty.local' } });
  const worker = await prisma.user.findUniqueOrThrow({ where: { email: 'worker@carparty.local' } });
  const clientUser = await prisma.user.findUniqueOrThrow({ where: { email: 'client@carparty.local' }, include: { clientProfile: true } });

  // extra clients
  const clientNames = ['Олександр Коваленко', 'Ірина Мельник', 'Дмитро Шевчук', 'Наталія Бондаренко', 'Андрій Ткаченко'];
  const clients = [clientUser.clientProfile!];
  for (const [i, name] of clientNames.entries()) {
    const u = await prisma.user.upsert({
      where: { email: `client${i + 2}@carparty.local` }, update: {},
      create: { email: `client${i + 2}@carparty.local`, passwordHash: clientUser.passwordHash, name, phone: `+38067${rnd(1000000, 9999999)}`, role: 'CLIENT', createdAt: ago(rnd(3, 60)),
        clientProfile: { create: { company: i % 2 ? 'ФОП' : null } } },
      include: { clientProfile: true },
    });
    clients.push(u.clientProfile!);
  }

  // source channels
  const channels = [];
  for (const [src, ext, name] of [[ExternalSource.TELEGRAM, '@avto_ua_sale', 'Авто UA | Продаж'], [ExternalSource.TELEGRAM, '@usa_cars_ua', 'Авто зі США'],
    [ExternalSource.OLX_UA, 'olx-cars', 'OLX · Легкові'], [ExternalSource.AUTO_RIA, 'autoria-api', 'AUTO.RIA API'], [ExternalSource.MARKETPLACE, 'fb-marketplace-kyiv', 'Marketplace · Київ']] as const) {
    channels.push(await prisma.sourceChannel.upsert({ where: { source_externalId: { source: src, externalId: ext } }, update: {}, create: { source: src, externalId: ext, name, lastSyncAt: ago(0, 9) } }));
  }

  // external leads
  for (let i = 0; i < 48; i++) {
    const [make, model, year, price, region] = cars[i % cars.length];
    const ch = channels[i % channels.length];
    const p = price + rnd(-900, 900);
    const text = `${make} ${model} ${year}, ${rnd(90, 240)} тис. км, ${['дизель', 'бензин', 'гібрид', 'електро'][i % 4]}, ${region}. Ціна ${p}$. Торг.`;
    await prisma.externalLead.upsert({
      where: { contentHash: createHash('sha1').update(text + i).digest('hex') }, update: {},
      create: { source: ch.source, channelId: ch.id, externalId: `demo-${i}`, sourceUrl: 'https://example.com/listing/' + i, rawText: text, description: text,
        price: p, currency: 'USD', make, model, year, region, status: statuses[i % statuses.length], parsedAt: ago(i / 3), contentHash: createHash('sha1').update(text + i).digest('hex'), createdAt: ago(i / 3, rnd(8, 22)) },
    });
  }

  // vehicles through the pipeline
  const flow: [VehicleStatus, ImportStatus | null][] = [[VehicleStatus.IN_AUCTION, ImportStatus.AUCTION], [VehicleStatus.WON, ImportStatus.PAYMENT], [VehicleStatus.IN_TRANSIT, ImportStatus.SHIPPING],
    [VehicleStatus.CUSTOMS, ImportStatus.CUSTOMS], [VehicleStatus.ON_YARD, ImportStatus.DELIVERED], [VehicleStatus.IN_DISMANTLE, ImportStatus.CLOSED], [VehicleStatus.IN_SERVICE, ImportStatus.CLOSED],
    [VehicleStatus.FOR_SALE, ImportStatus.CLOSED], [VehicleStatus.FOR_SALE, ImportStatus.CLOSED], [VehicleStatus.SOLD, ImportStatus.CLOSED], [VehicleStatus.DRAFT, ImportStatus.SEARCH], [VehicleStatus.DRAFT, ImportStatus.REQUEST]];
  for (const [i, [vs, is]] of flow.entries()) {
    const [make, model, year, price] = cars[(i * 5) % cars.length];
    const client = clients[i % clients.length];
    const vin = `DEMO${String(i).padStart(3, '0')}${'X'.repeat(10)}`;
    const v = await prisma.vehicle.upsert({ where: { vin }, update: {}, create: { vin, make, model, year, status: vs, clientId: client.id, createdAt: ago(40 - i * 3) } });
    if (is) await prisma.importRequest.upsert({ where: { vehicleId: v.id }, update: {}, create: { clientId: client.id, vehicleId: v.id, status: is, budget: price + 3000, lotNumber: `${rnd(40000000, 79999999)}`,
      auctionUrl: 'https://example.com/lot', shippingCost: rnd(1400, 2300), customsCost: rnd(2500, 5200), totalCost: price + rnd(4500, 7000), createdAt: ago(40 - i * 3) } });
    if (vs === VehicleStatus.IN_DISMANTLE) {
      const job = await prisma.dismantleJob.upsert({ where: { vehicleId: v.id }, update: {}, create: { vehicleId: v.id, status: DismantleStatus.IN_PROGRESS, startedAt: ago(6) } });
      for (const [n, c, pr] of [['Фара передня ліва', 'Оптика', 180], ['Двері передні праві', 'Кузов', 240], ['АКПП', 'Трансмісія', 950], ['Подушка безпеки керма', 'Безпека', 160], ['Радіатор', 'Охолодження', 120], ['Диски R18 комплект', 'Колеса', 420]] as const)
        await prisma.part.create({ data: { dismantleJobId: job.id, name: n, category: c, price: pr, location: `Стелаж ${rnd(1, 12)}`, isSold: Math.random() < 0.3 } });
    }
    if (vs === VehicleStatus.IN_SERVICE || vs === VehicleStatus.ON_YARD)
      await prisma.serviceOrder.create({ data: { clientId: client.id, vehicleId: v.id, status: vs === VehicleStatus.IN_SERVICE ? ServiceStatus.IN_PROGRESS : ServiceStatus.DIAGNOSTICS, description: 'Передпродажна підготовка: ходова, ТО, полірування', estimate: rnd(400, 1200), startedAt: ago(4) } });
    if (vs === VehicleStatus.FOR_SALE || vs === VehicleStatus.SOLD) {
      const s = await prisma.saleListing.upsert({ where: { vehicleId: v.id }, update: {}, create: { vehicleId: v.id, status: vs === VehicleStatus.SOLD ? SaleStatus.SOLD : SaleStatus.LISTED, price: price + 4900, description: `${make} ${model} ${year} — пригнаний, розмитнений, на ходу`,
        views: rnd(300, 2400), clicks: rnd(40, 260), publishedAt: ago(12) } });
      await prisma.deal.create({ data: { saleListingId: s.id, clientId: clients[(i + 1) % clients.length].id, amount: price + 4500, status: vs === VehicleStatus.SOLD ? 'closed' : 'pending', closedAt: vs === VehicleStatus.SOLD ? ago(2) : null } });
    }
  }

  // tasks
  for (const [t, m, done, due] of [['Перевірити історію VIN по Carfax', CrmModule.IMPORT, false, 1], ['Оплатити лот на Copart', CrmModule.IMPORT, true, -1], ['Сфотографувати запчастини для каталогу', CrmModule.DISMANTLE, false, 2],
    ['Погодити кошторис з клієнтом', CrmModule.SERVICE, false, 0], ['Опублікувати оголошення на AUTO.RIA', CrmModule.SALES, true, -2], ['Зателефонувати покупцю щодо огляду', CrmModule.SALES, false, 1]] as const)
    await prisma.task.create({ data: { title: t, module: m, isDone: done, dueDate: ago(-due), assigneeId: worker.id, createdById: admin.id } });

  // bot subscribers & payments
  for (let i = 0; i < 26; i++) {
    const plan = [BotPlan.FREE, BotPlan.FREE, BotPlan.BASIC, BotPlan.PRO][i % 4];
    await prisma.botSubscriber.upsert({ where: { telegramId: `90000${i}` }, update: {}, create: { telegramId: `90000${i}`, telegramUsername: `driver_${i}`, firstName: ['Олег', 'Марія', 'Тарас', 'Оксана', 'Ігор'][i % 5], plan, expiresAt: plan === BotPlan.FREE ? null : ago(-20), createdAt: ago(rnd(0, 30)),
      filters: { make: cars[i % cars.length][0], maxPrice: cars[i % cars.length][3] + 3000, regions: [cars[i % cars.length][4]] } } });
    if (plan !== BotPlan.FREE) await prisma.botPaymentOrder.upsert({ where: { orderId: `demo-order-${i}` }, update: {}, create: { orderId: `demo-order-${i}`, telegramId: `90000${i}`, plan, amountUah: plan === BotPlan.PRO ? 499 : 199, status: 'success', paidAt: ago(rnd(0, 25)), createdAt: ago(rnd(0, 25)) } });
  }

  // analytics events for the last 30 days
  const defs = await prisma.metricDefinition.findMany();
  const base: Record<string, [number, number]> = { 'sales.count': [0, 3], 'listing.views': [120, 420], 'listing.clicks': [12, 60], 'import.completed': [0, 2], 'clients.new': [0, 4] };
  const events = [];
  for (const d of defs) {
    const [a, b] = base[d.key] ?? [2, 25];
    for (let i = 29; i >= 0; i--) {
      const trend = 1 + (29 - i) / 45;
      const v = Math.round(rnd(a, b) * trend);
      if (v > 0) events.push({ metricKey: d.key, value: v, timestamp: ago(i, 13) });
    }
  }
  await prisma.analyticsEvent.createMany({ data: events });
  console.log('Demo data: leads 48, vehicles', flow.length, 'events', events.length);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
