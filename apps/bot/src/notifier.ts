import { BotPlan, LeadStatus, Prisma, prisma } from '@carparty/database';
import type { Bot } from 'grammy';
import { formatLeadMessage } from './format-lead';
import { parseLocale } from './i18n';
import { matchesFilters } from './match-filters';
import { effectivePlan, parseFilters, PLANS } from './plans';
import { processTrialLifecycle } from './trial';

const MARKET = 'UA';

export function startNotifier(bot: Bot, intervalMs: number): NodeJS.Timeout {
  const tick = () => {
    deliverNewLeads(bot).catch((error) => console.error('[notifier]', error));
    processTrialLifecycle(bot).catch((error) => console.error('[trial]', error));
  };

  tick();
  return setInterval(tick, intervalMs);
}

async function deliverNewLeads(bot: Bot): Promise<void> {
  const subscribers = await prisma.botSubscriber.findMany({
    where: { isActive: true },
  });

  if (!subscribers.length) return;

  const leads = await prisma.externalLead.findMany({
    where: {
      market: MARKET,
      status: { in: [LeadStatus.PARSED, LeadStatus.REVIEW] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  for (const subscriber of subscribers) {
    const plan = effectivePlan(subscriber.plan, subscriber.expiresAt);
    const config = PLANS[plan];
    await resetDailyCounterIfNeeded(subscriber.id, subscriber.dailyResetAt);

    const fresh = await prisma.botSubscriber.findUnique({ where: { id: subscriber.id } });
    if (!fresh || fresh.dailySent >= config.dailyLimit) continue;

    const filters = parseFilters(subscriber.filters);
    let sent = 0;

    for (const lead of leads) {
      if (fresh.dailySent + sent >= config.dailyLimit) break;

      const delayMs = config.delayMinutes * 60_000;
      if (delayMs > 0 && Date.now() - lead.createdAt.getTime() < delayMs) continue;

      if (!matchesFilters(lead, filters)) continue;

      const alreadySent = await prisma.botDelivery.findUnique({
        where: {
          subscriberId_leadId: {
            subscriberId: subscriber.id,
            leadId: lead.id,
          },
        },
      });
      if (alreadySent) continue;

      try {
        await bot.api.sendMessage(subscriber.telegramId, formatLeadMessage(lead, {
          locale: parseLocale(fresh.locale),
        }), {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: false },
        });

        await prisma.botDelivery.create({
          data: { subscriberId: subscriber.id, leadId: lead.id },
        });

        sent += 1;
      } catch (error) {
        console.error(`[notifier] failed for ${subscriber.telegramId}`, error);
      }
    }

    if (sent > 0) {
      await prisma.botSubscriber.update({
        where: { id: subscriber.id },
        data: { dailySent: { increment: sent } },
      });
    }
  }
}

async function resetDailyCounterIfNeeded(subscriberId: string, dailyResetAt: Date): Promise<void> {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (dailyResetAt.getTime() > dayAgo) return;

  await prisma.botSubscriber.update({
    where: { id: subscriberId },
    data: { dailySent: 0, dailyResetAt: new Date() },
  });
}

export async function activatePlan(
  telegramId: string,
  plan: BotPlan,
  days = 30,
): Promise<void> {
  const expiresAt = plan === BotPlan.FREE ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.botSubscriber.upsert({
    where: { telegramId },
    update: { plan, expiresAt, trialExpiresAt: null, dailySent: 0, dailyResetAt: new Date() },
    create: { telegramId, plan, expiresAt },
  });
}
