import { BotPlan, prisma } from '@carparty/database';

export async function activateSubscription(
  telegramId: string,
  plan: BotPlan,
  orderId?: string,
): Promise<void> {
  const expiresAt = plan === BotPlan.FREE ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    ...(orderId
      ? [
          prisma.botPaymentOrder.update({
            where: { id: orderId },
            data: { status: 'paid', paidAt: new Date() },
          }),
        ]
      : []),
    prisma.botSubscriber.upsert({
      where: { telegramId },
      update: {
        plan,
        expiresAt,
        trialExpiresAt: null,
        dailySent: 0,
        dailyResetAt: new Date(),
      },
      create: { telegramId, plan, expiresAt },
    }),
  ]);
}
