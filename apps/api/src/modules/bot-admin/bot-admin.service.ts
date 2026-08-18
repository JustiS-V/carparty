import { Injectable } from '@nestjs/common';
import { BotPlan, prisma } from '@carparty/database';

@Injectable()
export class BotAdminService {
  async getStats() {
    const [subscribers, paid, deliveries, orders, leads] = await Promise.all([
      prisma.botSubscriber.count(),
      prisma.botSubscriber.count({
        where: { plan: { in: [BotPlan.BASIC, BotPlan.PRO] }, expiresAt: { gt: new Date() } },
      }),
      prisma.botDelivery.count(),
      prisma.botPaymentOrder.count({ where: { status: 'paid' } }),
      prisma.externalLead.count({ where: { market: 'UA' } }),
    ]);

    return { subscribers, paid, deliveries, orders, leads };
  }

  listSubscribers() {
    return prisma.botSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deliveries: true } } },
    });
  }

  async activateSubscriber(id: string, plan: BotPlan, days: number) {
    const expiresAt =
      plan === BotPlan.FREE ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return prisma.botSubscriber.update({
      where: { id },
      data: { plan, expiresAt, dailySent: 0, dailyResetAt: new Date() },
    });
  }

  recentDeliveries() {
    return prisma.botDelivery.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        subscriber: { select: { telegramId: true, telegramUsername: true, plan: true } },
        lead: { select: { source: true, make: true, model: true, price: true, sourceUrl: true } },
      },
    });
  }
}
