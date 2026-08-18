import { prisma } from '@carparty/database';
import { parseFilters } from '../plans';

export type BotLocale = 'uk' | 'en';

export function parseLocale(value?: string | null): BotLocale {
  if (value === 'en') return 'en';
  return 'uk';
}

const uk = {
  startWelcome: [
    '👋 <b>CarParty UA</b> — моніторинг авто-ринку для перекупів',
    '',
    'Збираємо оголошення раніше конкурентів:',
    '• Telegram (Copart, аукціони, пригон USA)',
    '• AUTO.RIA та OLX',
    '• Facebook / Instagram',
    '',
    'Для перекупів: фільтри, миттєві алерти, посилання на джерело.',
    'Для покупців: актуальні пропозиції без зайвого шуму.',
    '',
    '/latest — останні оголошення',
    '/filters — фільтри (BASIC/PRO)',
    '/subscribe — тарифи',
    '/status — ваш план',
    '/trial — спробувати PRO',
    '/lang — мова / language',
  ].join('\n'),
  chooseLang: '🌐 Оберіть мову / Choose language:',
  langSetUk: '✅ Мову змінено на українську',
  langSetEn: '✅ Language set to English',
  plansTitle: '💳 <b>Тарифи CarParty UA</b>',
  planFree: '🆓 <b>Безкоштовний</b> — 0 грн\n3 оголошення/день, затримка 2 год',
  planBasic: '⭐ <b>Базовий</b> — 299 грн/міс\n30 оголошень/день, миттєво, фільтри',
  planPro: '🚀 <b>PRO</b> — 599 грн/міс\n500 оголошень/день, пріоритет, всі джерела',
  planSources: '<b>Джерела:</b> Telegram, AUTO.RIA, OLX, Facebook',
  payChoose: 'Оберіть спосіб оплати для <b>{plan}</b> — {price} грн/міс:',
  payLiqPay: '💳 LiqPay',
  payMonobank: '🏦 Monobank',
  payLiqPayLink: '💳 <b>{plan}</b> — {price} грн/міс\n\n<a href="{url}">Оплатити через LiqPay</a>\n\nПісля оплати тариф активується автоматично.',
  payMonobankInstr: [
    '🏦 <b>{plan}</b> — {price} грн/міс',
    '',
    'Перекажіть <b>{price} грн</b> на Monobank:',
    '<a href="{jarUrl}">Відкрити jar / банку</a>',
    '',
    '⚠️ У коментарі до платежу вкажіть:',
    '<code>{orderId}</code>',
    '',
    'Активація автоматична протягом 1–5 хв.',
  ].join('\n'),
  payManualFallback: 'Оплата на картку: <code>{card}</code>\nПісля оплати: <code>/paid {plan}</code>',
  paidUsage: 'Використання: /paid BASIC або /paid PRO',
  paidSent: '✅ Запит надіслано. Очікуйте активацію.',
  noAccess: 'Немає доступу',
  activateUsage: 'Використання: /activate TELEGRAM_ID BASIC|PRO',
  activatedUser: '✅ Тариф <b>{plan}</b> активовано на 30 днів!',
  activatedAdmin: 'Активовано {plan} для {id}',
  needStart: 'Спочатку /start',
  statusTitle: '📊 <b>Ваш тариф:</b> {plan}',
  statusExpires: 'Діє до: {date}',
  statusSent: 'Сьогодні надіслано: {sent}/{limit}',
  statusDelay: 'Затримка: {delay}',
  statusNoDelay: 'Затримка: немає',
  statusFilters: 'Фільтри: {filters}',
  filtersFreeOnly: 'Фільтри доступні на BASIC та PRO. /subscribe',
  filtersHelp: [
    '⚙️ <b>Фільтри для перекупів</b>',
    '',
    '<code>/filter make BMW,Audi</code>',
    '<code>/filter price 15000</code>',
    '<code>/filter year 2018</code>',
    '<code>/filter city Київ,Львів</code>',
    '<code>/filter keyword copart,аукціон</code>',
    '<code>/filter clear</code>',
  ].join('\n'),
  filterExample: 'Приклад: /filter make BMW',
  filterUnknown: 'Невідомий фільтр. /filters',
  filtersCleared: 'Фільтри очищено',
  filtersUpdated: '✅ Фільтри оновлено:\n{filters}',
  noLeads: 'Поки немає оголошень. Слідкуйте за оновленнями!',
  helpText: [
    '<b>CarParty UA</b> — агрегатор авто-оголошень для перекупів',
    '',
    '/latest — останні оголошення',
    '/subscribe — підписка',
    '/filters — фільтри',
    '/status — тариф',
    '/lang — мова',
  ].join('\n'),
  filterMakes: 'Марки: {val}',
  filterPrice: 'Макс. ціна: {val}',
  filterYear: 'Від {val} р.',
  filterCities: 'Міста: {val}',
  filterKeywords: 'Ключові: {val}',
  filterNone: 'немає',
  btnBasic: '⭐ Базовий 299 грн',
  btnPro: '🚀 PRO 599 грн',
  planNameFree: 'Безкоштовний',
  planNameBasic: 'Базовий',
  planNamePro: 'PRO',
  planNameTrial: 'Trial PRO',
  trialStarted: '🎁 <b>Trial PRO активовано на {hours} год!</b>\n\nУсі фільтри, миттєві алерти, 500 оголошень/день.\nДіє до: {date}\n\n/subscribe — продовжити після trial',
  trialReminder: '⏳ <b>Trial PRO закінчується через ~24 год</b>\n\nДіє до: {date}\n\n/subscribe — зберегти доступ',
  trialExpired: '⌛ <b>Trial PRO завершено</b>\n\nТариф FREE (3 оголошення/день, затримка 2 год).\n\n/subscribe — BASIC 299 грн або PRO 599 грн',
  statusTrial: '🎁 Trial PRO до: {date}',
  trialOffer: '🎁 Спробуйте <b>Trial PRO {hours} год</b> безкоштовно:\n• усі фільтри\n• миттєві алерти\n• 500 оголошень/день',
  trialSkipped: '✅ Обрано безкоштовний тариф FREE.\n\n/subscribe — коли будете готові',
  trialAlreadyUsed: 'Trial вже використано або пропущено. /subscribe',
  btnTrialStart: '🎁 Trial PRO {hours}h',
  btnTrialSkip: '⏭ Лишити FREE',
  openSource: 'Відкрити джерело',
  countryDefault: 'Україна',
} as const;

const en = {
  startWelcome: [
    '👋 <b>CarParty UA</b> — car market monitor for resellers',
    '',
    'We collect listings before your competitors:',
    '• Telegram (Copart, auctions, US imports)',
    '• AUTO.RIA & OLX',
    '• Facebook / Instagram',
    '',
    'For resellers: filters, instant alerts, source links.',
    'For buyers: relevant offers without noise.',
    '',
    '/latest — recent listings',
    '/filters — filters (BASIC/PRO)',
    '/subscribe — plans',
    '/status — your plan',
    '/trial — try PRO',
    '/lang — language',
  ].join('\n'),
  chooseLang: '🌐 Choose language / Оберіть мову:',
  langSetUk: '✅ Мову змінено на українську',
  langSetEn: '✅ Language set to English',
  plansTitle: '💳 <b>CarParty UA Plans</b>',
  planFree: '🆓 <b>Free</b> — 0 UAH\n3 listings/day, 2h delay',
  planBasic: '⭐ <b>Basic</b> — 299 UAH/mo\n30 listings/day, instant, filters',
  planPro: '🚀 <b>PRO</b> — 599 UAH/mo\n500 listings/day, priority, all sources',
  planSources: '<b>Sources:</b> Telegram, AUTO.RIA, OLX, Facebook',
  payChoose: 'Choose payment for <b>{plan}</b> — {price} UAH/mo:',
  payLiqPay: '💳 LiqPay',
  payMonobank: '🏦 Monobank',
  payLiqPayLink: '💳 <b>{plan}</b> — {price} UAH/mo\n\n<a href="{url}">Pay via LiqPay</a>\n\nYour plan activates automatically.',
  payMonobankInstr: [
    '🏦 <b>{plan}</b> — {price} UAH/mo',
    '',
    'Transfer <b>{price} UAH</b> via Monobank:',
    '<a href="{jarUrl}">Open jar</a>',
    '',
    '⚠️ Put this in the payment comment:',
    '<code>{orderId}</code>',
    '',
    'Auto-activation within 1–5 min.',
  ].join('\n'),
  payManualFallback: 'Pay to card: <code>{card}</code>\nThen: <code>/paid {plan}</code>',
  paidUsage: 'Usage: /paid BASIC or /paid PRO',
  paidSent: '✅ Request sent. Awaiting activation.',
  noAccess: 'Access denied',
  activateUsage: 'Usage: /activate TELEGRAM_ID BASIC|PRO',
  activatedUser: '✅ Plan <b>{plan}</b> activated for 30 days!',
  activatedAdmin: 'Activated {plan} for {id}',
  needStart: 'Run /start first',
  statusTitle: '📊 <b>Your plan:</b> {plan}',
  statusExpires: 'Valid until: {date}',
  statusSent: 'Sent today: {sent}/{limit}',
  statusDelay: 'Delay: {delay} min',
  statusNoDelay: 'Delay: none',
  statusFilters: 'Filters: {filters}',
  filtersFreeOnly: 'Filters on BASIC & PRO only. /subscribe',
  filtersHelp: [
    '⚙️ <b>Reseller filters</b>',
    '',
    '<code>/filter make BMW,Audi</code>',
    '<code>/filter price 15000</code>',
    '<code>/filter year 2018</code>',
    '<code>/filter city Kyiv,Lviv</code>',
    '<code>/filter keyword copart,auction</code>',
    '<code>/filter clear</code>',
  ].join('\n'),
  filterExample: 'Example: /filter make BMW',
  filterUnknown: 'Unknown filter. /filters',
  filtersCleared: 'Filters cleared',
  filtersUpdated: '✅ Filters updated:\n{filters}',
  noLeads: 'No listings yet. Stay tuned!',
  helpText: [
    '<b>CarParty UA</b> — car listing aggregator for resellers',
    '',
    '/latest — recent listings',
    '/subscribe — subscription',
    '/filters — filters',
    '/status — plan',
    '/lang — language',
  ].join('\n'),
  filterMakes: 'Makes: {val}',
  filterPrice: 'Max price: {val}',
  filterYear: 'From {val}',
  filterCities: 'Cities: {val}',
  filterKeywords: 'Keywords: {val}',
  filterNone: 'none',
  btnBasic: '⭐ Basic 299 UAH',
  btnPro: '🚀 PRO 599 UAH',
  planNameFree: 'Free',
  planNameBasic: 'Basic',
  planNamePro: 'PRO',
  planNameTrial: 'Trial PRO',
  trialStarted: '🎁 <b>Trial PRO activated for {hours}h!</b>\n\nAll filters, instant alerts, 500 listings/day.\nValid until: {date}\n\n/subscribe — continue after trial',
  trialReminder: '⏳ <b>Trial PRO ends in ~24h</b>\n\nValid until: {date}\n\n/subscribe — keep access',
  trialExpired: '⌛ <b>Trial PRO ended</b>\n\nDowngraded to FREE (3 listings/day, 2h delay).\n\n/subscribe — BASIC 299 or PRO 599 UAH',
  statusTrial: '🎁 Trial PRO until: {date}',
  trialOffer: '🎁 Try <b>Trial PRO {hours}h</b> for free:\n• all filters\n• instant alerts\n• 500 listings/day',
  trialSkipped: '✅ FREE plan selected.\n\n/subscribe — when you\'re ready',
  trialAlreadyUsed: 'Trial already used or skipped. /subscribe',
  btnTrialStart: '🎁 Trial PRO {hours}h',
  btnTrialSkip: '⏭ Stay on FREE',
  openSource: 'Open source',
  countryDefault: 'Ukraine',
} as const;

const messages = { uk, en };

export type MessageKey = keyof typeof uk;

export function t(locale: BotLocale, key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = messages[locale][key] ?? messages.uk[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function formatPlansMessage(locale: BotLocale): string {
  return [
    t(locale, 'plansTitle'),
    '',
    t(locale, 'planFree'),
    '',
    t(locale, 'planBasic'),
    '',
    t(locale, 'planPro'),
    '',
    t(locale, 'planSources'),
  ].join('\n');
}

export function formatFiltersText(
  locale: BotLocale,
  filters: ReturnType<typeof parseFilters>,
): string {
  const parts: string[] = [];
  if (filters.makes?.length) parts.push(t(locale, 'filterMakes', { val: filters.makes.join(', ') }));
  if (filters.maxPrice) parts.push(t(locale, 'filterPrice', { val: filters.maxPrice }));
  if (filters.minYear) parts.push(t(locale, 'filterYear', { val: filters.minYear }));
  if (filters.regions?.length) parts.push(t(locale, 'filterCities', { val: filters.regions.join(', ') }));
  if (filters.keywords?.length) parts.push(t(locale, 'filterKeywords', { val: filters.keywords.join(', ') }));
  return parts.length ? parts.join('\n') : t(locale, 'filterNone');
}

export async function getLocale(telegramId: string): Promise<BotLocale> {
  const sub = await prisma.botSubscriber.findUnique({
    where: { telegramId },
    select: { locale: true },
  });
  return parseLocale(sub?.locale);
}

export function planLabel(locale: BotLocale, plan: 'FREE' | 'BASIC' | 'PRO'): string {
  const map = {
    FREE: 'planNameFree',
    BASIC: 'planNameBasic',
    PRO: 'planNamePro',
  } as const;
  return t(locale, map[plan]);
}
