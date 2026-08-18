import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@carparty/database';
import { AnalyticsService } from '../../analytics/analytics.service';

export interface DailyPoint {
  date: string;
  value: number;
}

export interface DailyAnalytics {
  days: number;
  from: string;
  to: string;
  leads: DailyPoint[];
  deliveries: DailyPoint[];
  payments: DailyPoint[];
  revenue: DailyPoint[];
  subscribers: DailyPoint[];
  leadsBySource: Array<{ date: string; source: string; value: number }>;
  totals: {
    leads: number;
    deliveries: number;
    payments: number;
    revenueUah: number;
    subscribers: number;
  };
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private analytics: AnalyticsService) {}

  async getDailySeries(days = 30): Promise<DailyAnalytics> {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);

    const dateKeys = buildDateRange(from, to);

    const [leadsRaw, deliveriesRaw, paymentsRaw, revenueRaw, subscribersRaw, leadsBySourceRaw] =
      await Promise.all([
        this.countByDay('ExternalLead', 'createdAt', from, { market: 'UA' }),
        this.countByDay('BotDelivery', 'sentAt', from),
        this.countByDay('BotPaymentOrder', 'paidAt', from, { status: 'paid' }),
        this.sumByDay('BotPaymentOrder', 'paidAt', 'amountUah', from, { status: 'paid' }),
        this.countByDay('BotSubscriber', 'createdAt', from),
        this.leadsBySourceByDay(from),
      ]);

    const leads = fillSeries(dateKeys, leadsRaw);
    const deliveries = fillSeries(dateKeys, deliveriesRaw);
    const payments = fillSeries(dateKeys, paymentsRaw);
    const revenue = fillSeries(dateKeys, revenueRaw);
    const subscribers = fillSeries(dateKeys, subscribersRaw);

    return {
      days,
      from: from.toISOString(),
      to: to.toISOString(),
      leads,
      deliveries,
      payments,
      revenue,
      subscribers,
      leadsBySource: leadsBySourceRaw,
      totals: {
        leads: sumPoints(leads),
        deliveries: sumPoints(deliveries),
        payments: sumPoints(payments),
        revenueUah: sumPoints(revenue),
        subscribers: sumPoints(subscribers),
      },
    };
  }

  /** Кожну годину — синхронізація лічильників з БД у analytics events */
  @Cron(CronExpression.EVERY_HOUR)
  async collectHourlySnapshots() {
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const [newLeads, newDeliveries, newPayments, newSubs] = await Promise.all([
      prisma.externalLead.findMany({
        where: { market: 'UA', createdAt: { gte: since } },
        select: { source: true },
      }),
      prisma.botDelivery.count({ where: { sentAt: { gte: since } } }),
      prisma.botPaymentOrder.findMany({
        where: { status: 'paid', paidAt: { gte: since } },
        select: { amountUah: true, plan: true },
      }),
      prisma.botSubscriber.count({ where: { createdAt: { gte: since } } }),
    ]);

    if (newLeads.length) {
      const bySource = groupCount(newLeads.map((l) => l.source));
      for (const [source, count] of Object.entries(bySource)) {
        await this.analytics.track({
          metric: 'leads.ingested',
          value: count,
          dimensions: { source, outcome: 'synced' },
        });
      }
    }

    if (newDeliveries > 0) {
      await this.analytics.track({ metric: 'bot.deliveries', value: newDeliveries });
    }

    for (const payment of newPayments) {
      await this.analytics.track({
        metric: 'bot.payments',
        value: 1,
        dimensions: { plan: payment.plan },
      });
      await this.analytics.track({
        metric: 'bot.revenue',
        value: payment.amountUah,
        dimensions: { plan: payment.plan },
      });
    }

    if (newSubs > 0) {
      await this.analytics.track({ metric: 'bot.subscribers.new', value: newSubs });
    }
  }

  /** Щоденний знімок агрегатів (опівніч + кожні 6 год для надійності) */
  @Cron('0 */6 * * *')
  async collectDailySnapshots() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [leadsToday, deliveriesToday, revenueToday] = await Promise.all([
      prisma.externalLead.count({ where: { market: 'UA', createdAt: { gte: todayStart } } }),
      prisma.botDelivery.count({ where: { sentAt: { gte: todayStart } } }),
      prisma.botPaymentOrder.aggregate({
        where: { status: 'paid', paidAt: { gte: todayStart } },
        _sum: { amountUah: true },
      }),
    ]);

    const day = formatDayKey(todayStart);

    await this.analytics.track({
      metric: 'admin.daily.leads',
      value: leadsToday,
      dimensions: { day },
    });
    await this.analytics.track({
      metric: 'admin.daily.deliveries',
      value: deliveriesToday,
      dimensions: { day },
    });
    await this.analytics.track({
      metric: 'admin.daily.revenue',
      value: revenueToday._sum.amountUah ?? 0,
      dimensions: { day },
    });
  }

  private async countByDay(
    table: 'ExternalLead' | 'BotDelivery' | 'BotPaymentOrder' | 'BotSubscriber',
    column: string,
    from: Date,
    whereExtra?: Record<string, unknown>,
  ): Promise<Record<string, number>> {
    const rows = await prisma.$queryRawUnsafe<Array<{ day: Date; count: bigint }>>(
      `SELECT DATE("${column}") as day, COUNT(*)::bigint as count
       FROM "${table}"
       WHERE "${column}" >= $1
       ${whereExtra?.market ? `AND market = '${whereExtra.market}'` : ''}
       ${whereExtra?.status ? `AND status = '${whereExtra.status}'` : ''}
       GROUP BY DATE("${column}")
       ORDER BY day`,
      from,
    );

    return Object.fromEntries(rows.map((r) => [formatDayKey(r.day), Number(r.count)]));
  }

  private async sumByDay(
    table: 'BotPaymentOrder',
    dateColumn: string,
    sumColumn: string,
    from: Date,
    whereExtra?: Record<string, unknown>,
  ): Promise<Record<string, number>> {
    const rows = await prisma.$queryRawUnsafe<Array<{ day: Date; total: number }>>(
      `SELECT DATE("${dateColumn}") as day, COALESCE(SUM("${sumColumn}"), 0)::float as total
       FROM "${table}"
       WHERE "${dateColumn}" >= $1
       ${whereExtra?.status ? `AND status = '${whereExtra.status}'` : ''}
       GROUP BY DATE("${dateColumn}")
       ORDER BY day`,
      from,
    );

    return Object.fromEntries(rows.map((r) => [formatDayKey(r.day), r.total]));
  }

  private async leadsBySourceByDay(from: Date) {
    const rows = await prisma.$queryRaw<Array<{ day: Date; source: string; count: bigint }>>`
      SELECT DATE("createdAt") as day, source, COUNT(*)::bigint as count
      FROM "ExternalLead"
      WHERE market = 'UA' AND "createdAt" >= ${from}
      GROUP BY DATE("createdAt"), source
      ORDER BY day, source
    `;

    return rows.map((r) => ({
      date: formatDayKey(r.day),
      source: r.source,
      value: Number(r.count),
    }));
  }
}

function buildDateRange(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    keys.push(formatDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function formatDayKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fillSeries(dateKeys: string[], raw: Record<string, number>): DailyPoint[] {
  return dateKeys.map((date) => ({ date, value: raw[date] ?? 0 }));
}

function sumPoints(points: DailyPoint[]): number {
  return points.reduce((sum, p) => sum + p.value, 0);
}

function groupCount(items: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item] = (map[item] ?? 0) + 1;
  }
  return map;
}
