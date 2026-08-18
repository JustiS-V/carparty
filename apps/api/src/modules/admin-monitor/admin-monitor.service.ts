import { Injectable } from '@nestjs/common';
import { BotPlan, ImportStatus, LeadStatus, SaleStatus, prisma } from '@carparty/database';

@Injectable()
export class AdminMonitorService {
  async getOverview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      botSubscribers,
      botPaid,
      botDeliveries,
      botOrdersPaid,
      botRevenue,
      leadsTotal,
      leadsToday,
      leadsBySource,
      leadsByStatus,
      channels,
      importsTotal,
      importsActive,
      salesListed,
      salesSold,
      serviceOrders,
      dismantleJobs,
      usersTotal,
      workers,
      clients,
      openTasks,
      recentLeads,
      recentDeliveries,
      recentPayments,
      recentIngestEvents,
    ] = await Promise.all([
      prisma.botSubscriber.count(),
      prisma.botSubscriber.count({
        where: { plan: { in: [BotPlan.BASIC, BotPlan.PRO] }, expiresAt: { gt: new Date() } },
      }),
      prisma.botDelivery.count(),
      prisma.botPaymentOrder.count({ where: { status: 'paid' } }),
      prisma.botPaymentOrder.aggregate({
        where: { status: 'paid' },
        _sum: { amountUah: true },
      }),
      prisma.externalLead.count({ where: { market: 'UA' } }),
      prisma.externalLead.count({ where: { market: 'UA', createdAt: { gte: todayStart } } }),
      prisma.externalLead.groupBy({
        by: ['source'],
        where: { market: 'UA' },
        _count: { id: true },
      }),
      prisma.externalLead.groupBy({
        by: ['status'],
        where: { market: 'UA' },
        _count: { id: true },
      }),
      prisma.sourceChannel.findMany({
        orderBy: { lastSyncAt: 'desc' },
        include: { _count: { select: { leads: true } } },
      }),
      prisma.importRequest.count(),
      prisma.importRequest.count({
        where: { status: { notIn: [ImportStatus.DELIVERED, ImportStatus.CLOSED] } },
      }),
      prisma.saleListing.count({ where: { status: SaleStatus.LISTED } }),
      prisma.saleListing.count({ where: { status: SaleStatus.SOLD } }),
      prisma.serviceOrder.count(),
      prisma.dismantleJob.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'WORKER' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.task.count({ where: { isDone: false } }),
      prisma.externalLead.findMany({
        where: { market: 'UA' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { channel: true },
      }),
      prisma.botDelivery.findMany({
        orderBy: { sentAt: 'desc' },
        take: 8,
        include: {
          subscriber: { select: { telegramUsername: true, plan: true } },
          lead: { select: { source: true, make: true, model: true, price: true } },
        },
      }),
      prisma.botPaymentOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.analyticsEvent.findMany({
        where: { metricKey: 'leads.ingested' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      bot: {
        subscribers: botSubscribers,
        paid: botPaid,
        deliveries: botDeliveries,
        ordersPaid: botOrdersPaid,
        revenueUah: botRevenue._sum.amountUah ?? 0,
      },
      collectors: {
        totalLeads: leadsTotal,
        todayLeads: leadsToday,
        bySource: Object.fromEntries(leadsBySource.map((r) => [r.source, r._count.id])),
        byStatus: Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count.id])),
        channels: channels.map((ch) => ({
          id: ch.id,
          name: ch.name,
          source: ch.source,
          externalId: ch.externalId,
          isActive: ch.isActive,
          lastSyncAt: ch.lastSyncAt,
          leadsCount: ch._count.leads,
        })),
      },
      crm: {
        imports: { total: importsTotal, active: importsActive },
        sales: { listed: salesListed, sold: salesSold },
        serviceOrders,
        dismantleJobs,
        users: { total: usersTotal, workers, clients },
        openTasks,
      },
      recent: {
        leads: recentLeads,
        deliveries: recentDeliveries,
        payments: recentPayments,
        ingestEvents: recentIngestEvents.map((e) => ({
          timestamp: e.timestamp,
          dimensions: e.dimensions,
        })),
      },
    };
  }

  async healthCheck() {
    const started = Date.now();
    await prisma.user.count();
    return {
      status: 'ok',
      database: 'connected',
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    };
  }
}
