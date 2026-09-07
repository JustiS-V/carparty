import { BotPlan, LeadStatus, Prisma, prisma } from '@carparty/database';
import { Bot, InlineKeyboard } from 'grammy';
import { formatLeadMessage } from './format-lead';
import {
  formatFiltersText,
  formatPlansMessage,
  getLocale,
  parseLocale,
  planLabel,
  t,
  type BotLocale,
} from './i18n';
import { activatePlan, startNotifier } from './notifier';
import { effectivePlan, parseFilters, PLANS } from './plans';
import { displayPlanLabel, sendTrialOffer, skipTrial, startTrial, trialOfferKeyboard, trialStartedMessage, TRIAL_HOURS } from './trial';

const ADMIN_IDS = (process.env.BOT_ADMIN_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const PAYMENT_CARD = process.env.BOT_PAYMENT_CARD ?? '';
const API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000/api';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.command('start', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const existing = await prisma.botSubscriber.findUnique({
      where: { telegramId: String(user.id) },
    });

    await prisma.botSubscriber.upsert({
      where: { telegramId: String(user.id) },
      update: {
        telegramUsername: user.username,
        firstName: user.first_name,
      },
      create: {
        telegramId: String(user.id),
        telegramUsername: user.username,
        firstName: user.first_name,
        locale: 'uk',
      },
    });

    if (!existing) {
      const keyboard = new InlineKeyboard()
        .text('🇺🇦 Українська', 'lang:uk')
        .text('🇬🇧 English', 'lang:en');
      await ctx.reply(t('uk', 'chooseLang'), { reply_markup: keyboard });
    } else {
      const locale = parseLocale(existing.locale);
      await ctx.reply(t(locale, 'startWelcome'), { parse_mode: 'HTML' });
      await sendTrialOffer(bot, String(user.id), locale);
    }
  });

  bot.callbackQuery(/^lang:(uk|en)$/, async (ctx) => {
    const locale = ctx.match[1] as BotLocale;
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;

    await prisma.botSubscriber.update({
      where: { telegramId: String(ctx.from.id) },
      data: { locale },
    });

    await ctx.reply(locale === 'uk' ? t('uk', 'langSetUk') : t('en', 'langSetEn'));
    await ctx.reply(t(locale, 'startWelcome'), { parse_mode: 'HTML' });
    await sendTrialOffer(bot, String(ctx.from.id), locale);
  });

  bot.callbackQuery('trial:start', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const locale = await getLocale(String(ctx.from.id));

    const started = await startTrial(String(ctx.from.id));
    if (!started) {
      await ctx.reply(t(locale, 'trialAlreadyUsed'));
      return;
    }

    await ctx.reply(await trialStartedMessage(String(ctx.from.id)), { parse_mode: 'HTML' });
  });

  bot.callbackQuery('trial:skip', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const locale = await getLocale(String(ctx.from.id));

    const skipped = await skipTrial(String(ctx.from.id));
    if (!skipped) {
      await ctx.reply(t(locale, 'trialAlreadyUsed'));
      return;
    }

    await ctx.reply(t(locale, 'trialSkipped'), { parse_mode: 'HTML' });
  });

  bot.command('trial', async (ctx) => {
    if (!ctx.from) return;
    const locale = await getLocale(String(ctx.from.id));
    const sub = await prisma.botSubscriber.findUnique({
      where: { telegramId: String(ctx.from.id) },
    });

    if (!sub) {
      await ctx.reply(t(locale, 'needStart'));
      return;
    }

    if (sub.trialUsedAt) {
      await ctx.reply(t(locale, 'trialAlreadyUsed'));
      return;
    }

    await ctx.reply(t(locale, 'trialOffer', { hours: TRIAL_HOURS }), {
      parse_mode: 'HTML',
      reply_markup: trialOfferKeyboard(locale),
    });
  });

  bot.command('lang', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('🇺🇦 Українська', 'lang:uk')
      .text('🇬🇧 English', 'lang:en');
    await ctx.reply(t(await getLocale(String(ctx.from?.id)), 'chooseLang'), {
      reply_markup: keyboard,
    });
  });

  bot.command('subscribe', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    const keyboard = new InlineKeyboard()
      .text(t(locale, 'btnBasic'), 'plan:BASIC')
      .text(t(locale, 'btnPro'), 'plan:PRO');

    await ctx.reply(formatPlansMessage(locale), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery(/^plan:(BASIC|PRO)$/, async (ctx) => {
    const plan = ctx.match[1] as 'BASIC' | 'PRO';
    await ctx.answerCallbackQuery();
    const locale = await getLocale(String(ctx.from?.id));
    const planLabelText = planLabel(locale, plan);
    const price = PLANS[plan].priceUah;

    const keyboard = new InlineKeyboard()
      .text(t(locale, 'payLiqPay'), `pay:liqpay:${plan}`)
      .text(t(locale, 'payMonobank'), `pay:monobank:${plan}`);

    if (process.env.STRIPE_ENABLED === 'true') keyboard.row().text('Stripe', `pay:stripe:${plan}`);

    await ctx.reply(t(locale, 'payChoose', { plan: planLabelText, price }), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery(/^pay:(liqpay|monobank|stripe):(BASIC|PRO)$/, async (ctx) => {
    const method = ctx.match[1];
    const plan = ctx.match[2] as 'BASIC' | 'PRO';
    await ctx.answerCallbackQuery();

    const locale = await getLocale(String(ctx.from?.id));
    const telegramId = String(ctx.from?.id);
    const planLabelText = planLabel(locale, plan);
    const price = PLANS[plan].priceUah;

    try {
      if (method === 'stripe' && process.env.STRIPE_ENABLED === 'true') {
        const response = await fetch(`${API_URL}/payments/stripe/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, plan }),
        });
        const data = await response.json() as { checkoutUrl?: string };
        if (response.ok && data.checkoutUrl) {
          await ctx.reply(`Stripe · ${planLabelText}`, { reply_markup: new InlineKeyboard().url('Stripe Checkout', data.checkoutUrl) });
          return;
        }
      }
      if (method === 'liqpay') {
        const response = await fetch(`${API_URL}/payments/liqpay/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, plan }),
        });
        const data = (await response.json()) as { checkoutUrl?: string };

        if (data.checkoutUrl) {
          await ctx.reply(
            t(locale, 'payLiqPayLink', { plan: planLabelText, price, url: data.checkoutUrl }),
            { parse_mode: 'HTML' },
          );
          return;
        }
      }

      if (method === 'monobank') {
        const response = await fetch(`${API_URL}/payments/monobank/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, plan }),
        });
        const data = (await response.json()) as {
          orderId?: string;
          jarUrl?: string;
          amountUah?: number;
          error?: string;
        };

        if (data.orderId && data.jarUrl) {
          await ctx.reply(
            t(locale, 'payMonobankInstr', {
              plan: planLabelText,
              price: data.amountUah ?? price,
              jarUrl: data.jarUrl,
              orderId: data.orderId,
            }),
            { parse_mode: 'HTML' },
          );
          return;
        }
      }
    } catch {
      // fallback below
    }

    if (PAYMENT_CARD) {
      await ctx.reply(
        t(locale, 'payManualFallback', { card: PAYMENT_CARD, plan }),
        { parse_mode: 'HTML' },
      );
    }
  });

  bot.command('paid', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    const plan = ctx.message?.text?.split(/\s+/)[1]?.toUpperCase();
    if (plan !== 'BASIC' && plan !== 'PRO') {
      await ctx.reply(t(locale, 'paidUsage'));
      return;
    }

    for (const adminId of ADMIN_IDS) {
      await ctx.api.sendMessage(
        adminId,
        [
          '📩 Payment activation request',
          `User: ${ctx.from?.username ? '@' + ctx.from.username : ctx.from?.id}`,
          `Plan: ${plan}`,
          `/activate ${ctx.from?.id} ${plan}`,
        ].join('\n'),
      );
    }

    await ctx.reply(t(locale, 'paidSent'));
  });

  bot.command('activate', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    if (!ctx.from || !ADMIN_IDS.includes(String(ctx.from.id))) {
      await ctx.reply(t(locale, 'noAccess'));
      return;
    }

    const [, telegramId, planRaw] = ctx.message?.text?.split(/\s+/) ?? [];
    const plan = planRaw?.toUpperCase();
    if (!telegramId || (plan !== 'BASIC' && plan !== 'PRO')) {
      await ctx.reply(t(locale, 'activateUsage'));
      return;
    }

    await activatePlan(telegramId, plan as BotPlan);
    const userLocale = await getLocale(telegramId);
    await ctx.api.sendMessage(
      telegramId,
      t(userLocale, 'activatedUser', { plan: planLabel(userLocale, plan as 'BASIC' | 'PRO') }),
      { parse_mode: 'HTML' },
    );
    await ctx.reply(t(locale, 'activatedAdmin', { plan, id: telegramId }));
  });

  bot.command('status', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    const sub = await prisma.botSubscriber.findUnique({
      where: { telegramId: String(ctx.from?.id) },
    });

    if (!sub) {
      await ctx.reply(t(locale, 'needStart'));
      return;
    }

    const plan = effectivePlan(sub.plan, sub.expiresAt);
    const config = PLANS[plan];
    const dateLocale = locale === 'uk' ? 'uk-UA' : 'en-GB';

    await ctx.reply(
      [
        t(locale, 'statusTitle', {
          plan: displayPlanLabel(locale, plan, sub),
        }),
        sub.trialExpiresAt && sub.trialExpiresAt > new Date()
          ? t(locale, 'statusTrial', {
              date: sub.trialExpiresAt.toLocaleString(dateLocale),
            })
          : sub.expiresAt && plan !== 'FREE'
            ? t(locale, 'statusExpires', {
                date: sub.expiresAt.toLocaleDateString(dateLocale),
              })
            : '',
        t(locale, 'statusSent', { sent: sub.dailySent, limit: config.dailyLimit }),
        config.delayMinutes
          ? t(locale, 'statusDelay', { delay: config.delayMinutes })
          : t(locale, 'statusNoDelay'),
        t(locale, 'statusFilters', {
          filters: formatFiltersText(locale, parseFilters(sub.filters)),
        }),
      ]
        .filter(Boolean)
        .join('\n'),
      { parse_mode: 'HTML' },
    );
  });

  bot.command('filters', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    await ctx.reply(t(locale, 'filtersHelp'), { parse_mode: 'HTML' });
  });

  bot.command('filter', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    const args = ctx.message?.text?.replace(/^\/filter\s+/, '').trim();
    if (!args) {
      await ctx.reply(t(locale, 'filterExample'));
      return;
    }

    const sub = await prisma.botSubscriber.findUnique({
      where: { telegramId: String(ctx.from?.id) },
    });
    if (!sub) {
      await ctx.reply(t(locale, 'needStart'));
      return;
    }

    const plan = effectivePlan(sub.plan, sub.expiresAt);
    if (plan === 'FREE') {
      await ctx.reply(t(locale, 'filtersFreeOnly'));
      return;
    }

    const filters = parseFilters(sub.filters);
    const [key, ...rest] = args.split(/\s+/);
    const value = rest.join(' ');

    if (key === 'clear') {
      await prisma.botSubscriber.update({
        where: { id: sub.id },
        data: { filters: {} },
      });
      await ctx.reply(t(locale, 'filtersCleared'));
      return;
    }

    if (key === 'make') {
      filters.makes = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (key === 'price') {
      filters.maxPrice = Number(value);
    } else if (key === 'year') {
      filters.minYear = Number(value);
    } else if (key === 'city') {
      filters.regions = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (key === 'keyword') {
      filters.keywords = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      await ctx.reply(t(locale, 'filterUnknown'));
      return;
    }

    await prisma.botSubscriber.update({
      where: { id: sub.id },
      data: { filters: filters as Prisma.InputJsonValue },
    });

    await ctx.reply(
      t(locale, 'filtersUpdated', { filters: formatFiltersText(locale, filters) }),
    );
  });

  bot.command('latest', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    const sub = await prisma.botSubscriber.findUnique({
      where: { telegramId: String(ctx.from?.id) },
    });
    const plan = effectivePlan(sub?.plan ?? BotPlan.FREE, sub?.expiresAt ?? null);
    const limit = plan === 'FREE' ? 2 : plan === 'BASIC' ? 5 : 10;

    const leads = await prisma.externalLead.findMany({
      where: { market: 'UA', status: { in: [LeadStatus.PARSED, LeadStatus.REVIEW] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (!leads.length) {
      await ctx.reply(t(locale, 'noLeads'));
      return;
    }

    for (const lead of leads) {
      await ctx.reply(formatLeadMessage(lead, { preview: true, locale }), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: false },
      });
    }
  });

  bot.command('help', async (ctx) => {
    const locale = await getLocale(String(ctx.from?.id));
    await ctx.reply(t(locale, 'helpText'), { parse_mode: 'HTML' });
  });

  return bot;
}

export function runBot(token: string): void {
  const bot = createBot(token);
  const interval = Number(process.env.BOT_NOTIFY_INTERVAL_MS ?? 30_000);

  bot.catch((error) => console.error('[bot]', error));
  startNotifier(bot, interval);

  bot.start({
    onStart: () => console.log('[bot] CarParty UA bot started (uk/en)'),
  });
}
