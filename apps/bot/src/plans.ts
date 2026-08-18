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

export function effectivePlan(plan: BotPlan, expiresAt: Date | null): BotPlan {
  return isSubscriptionActive(plan, expiresAt) ? plan : 'FREE';
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
