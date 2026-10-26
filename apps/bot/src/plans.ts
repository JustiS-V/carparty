import type { BotPlan, SubscriberFilters } from '@carparty/types';

export interface PlanConfig {
  label: string;
  priceUah: number;
  dailyLimit: number;
  delayMinutes: number;
  description: string;
}

export const PLANS: Record<BotPlan, PlanConfig> = {
  FREE: {
    label: 'Безкоштовний',
    priceUah: 0,
    dailyLimit: 3,
    delayMinutes: 120,
    description: '3 оголошення на день, затримка 2 години',
  },
  BASIC: {
    label: 'Базовий',
    priceUah: 299,
    dailyLimit: 30,
    delayMinutes: 0,
    description: '30 оголошень/день, миттєво, фільтри по марці та ціні',
  },
  PRO: {
    label: 'PRO',
    priceUah: 599,
    dailyLimit: 500,
    delayMinutes: 0,
    description: 'Безлімітні фільтри, пріоритетна доставка, всі джерела',
  },
};

export function isSubscriptionActive(plan: BotPlan, expiresAt: Date | null): boolean {
  if (plan === 'FREE') return true;
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now();
}

/**
 * Alpha test (BOT_ALPHA=true): every tester gets the full feature set for free
 * and payment commands are switched off.
 */
export const ALPHA = process.env.BOT_ALPHA === 'true';

export function effectivePlan(plan: BotPlan, expiresAt: Date | null): BotPlan {
  if (ALPHA) return 'PRO';
  return isSubscriptionActive(plan, expiresAt) ? plan : 'FREE';
}

/** Sources that are actually configured, for honest copy in the bot. */
export function activeSources(): string[] {
  const sources: string[] = [];
  if (process.env.TELEGRAM_PUBLIC_CHANNELS || process.env.TELEGRAM_API_ID) sources.push('Telegram');
  if (process.env.AUTORIA_API_KEY) sources.push('AUTO.RIA');
  if (process.env.OLX_ENABLED === 'true') sources.push('OLX');
  return sources;
}

export function parseFilters(raw: unknown): SubscriberFilters {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as SubscriberFilters;
  return {
    makes: Array.isArray(value.makes) ? value.makes.map(String) : undefined,
    maxPrice: typeof value.maxPrice === 'number' ? value.maxPrice : undefined,
    minYear: typeof value.minYear === 'number' ? value.minYear : undefined,
    regions: Array.isArray(value.regions) ? value.regions.map(String) : undefined,
    keywords: Array.isArray(value.keywords) ? value.keywords.map(String) : undefined,
  };
}
