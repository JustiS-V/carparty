import { BotPlan, prisma } from '@carparty/database';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getLocale, planLabel, t } from './i18n';

export const TRIAL_HOURS = Number(process.env.BOT_TRIAL_HOURS ?? 48);

export function isOnTrial(sub: {
  trialExpiresAt: Date | null;
}): boolean {
  if (!sub.trialExpiresAt) return false;
  return sub.trialExpiresAt.getTime() > Date.now();
}

export async function startTrial(telegramId: string): Promise<boolean> {
  const sub = await prisma.botSubscriber.findUnique({ where: { telegramId } });
  if (!sub || sub.trialUsedAt) return false;

  const trialExpiresAt = new Date(Date.now() + TRIAL_HOURS * 60 * 60 * 1000);

  await prisma.botSubscriber.update({
    where: { telegramId },
    data: {
      plan: BotPlan.PRO,
      expiresAt: trialExpiresAt,
      trialUsedAt: new Date(),
      trialExpiresAt,
      trialReminderSent: false,
      dailySent: 0,
      dailyResetAt: new Date(),
    },
  });

  return true;
}

export async function processTrialLifecycle(bot: Bot): Promise<void> {
  const now = new Date();
  const reminderThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const trialUsers = await prisma.botSubscriber.findMany({
    where: { trialExpiresAt: { not: null } },
  });

  for (const sub of trialUsers) {
    const locale = sub.locale === 'en' ? 'en' : 'uk';

    if (sub.trialExpiresAt && sub.trialExpiresAt <= now) {
      await prisma.botSubscriber.update({
        where: { id: sub.id },
        data: {
          plan: BotPlan.FREE,
          expiresAt: null,
          trialExpiresAt: null,
        },
      });

      try {
        await bot.api.sendMessage(
          sub.telegramId,
          t(locale, 'trialExpired'),
          { parse_mode: 'HTML' },
        );
      } catch {
        // user blocked bot
      }
      continue;
    }

    if (
      sub.trialExpiresAt &&
      sub.trialExpiresAt <= reminderThreshold &&
      !sub.trialReminderSent
    ) {
      const dateLocale = locale === 'uk' ? 'uk-UA' : 'en-GB';
      try {
        await bot.api.sendMessage(
          sub.telegramId,
          t(locale, 'trialReminder', {
            date: sub.trialExpiresAt.toLocaleString(dateLocale),
            hours: TRIAL_HOURS,
          }),
          { parse_mode: 'HTML' },
        );
        await prisma.botSubscriber.update({
          where: { id: sub.id },
          data: { trialReminderSent: true },
        });
      } catch {
        // ignore
      }
    }
  }
}

export function displayPlanLabel(
  locale: 'uk' | 'en',
  plan: BotPlan,
  sub: { trialExpiresAt: Date | null },
): string {
  if (isOnTrial(sub)) {
    return t(locale, 'planNameTrial');
  }
  return planLabel(locale, plan);
}

export async function skipTrial(telegramId: string): Promise<boolean> {
  const sub = await prisma.botSubscriber.findUnique({ where: { telegramId } });
  if (!sub || sub.trialUsedAt) return false;

  await prisma.botSubscriber.update({
    where: { telegramId },
    data: {
      trialUsedAt: new Date(),
      trialExpiresAt: null,
      plan: BotPlan.FREE,
      expiresAt: null,
    },
  });

  return true;
}

export function trialOfferKeyboard(locale: 'uk' | 'en'): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, 'btnTrialStart', { hours: TRIAL_HOURS }), 'trial:start')
    .text(t(locale, 'btnTrialSkip'), 'trial:skip');
}

export async function sendTrialOffer(
  bot: Bot,
  telegramId: string,
  locale: 'uk' | 'en',
): Promise<void> {
  const sub = await prisma.botSubscriber.findUnique({ where: { telegramId } });
  if (!sub || sub.trialUsedAt) return;
  if (sub.plan !== BotPlan.FREE) return;

  await bot.api.sendMessage(telegramId, t(locale, 'trialOffer', { hours: TRIAL_HOURS }), {
    parse_mode: 'HTML',
    reply_markup: trialOfferKeyboard(locale),
  });
}

export async function trialStartedMessage(telegramId: string): Promise<string> {
  const locale = await getLocale(telegramId);
  const dateLocale = locale === 'uk' ? 'uk-UA' : 'en-GB';
  const expiresAt = new Date(Date.now() + TRIAL_HOURS * 60 * 60 * 1000);
  return t(locale, 'trialStarted', {
    hours: TRIAL_HOURS,
    date: expiresAt.toLocaleString(dateLocale),
  });
}
