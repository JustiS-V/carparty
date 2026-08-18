import type { SubscriberFilters } from '@carparty/types';

interface LeadForMatch {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  region?: string | null;
  description?: string | null;
  rawText: string;
}

export function matchesFilters(lead: LeadForMatch, filters: SubscriberFilters): boolean {
  if (filters.makes?.length) {
    const make = (lead.make ?? '').toLowerCase();
    const hit = filters.makes.some((item) => make.includes(item.toLowerCase()));
    if (!hit) return false;
  }

  if (filters.maxPrice != null && lead.price != null && lead.price > filters.maxPrice) {
    return false;
  }

  if (filters.minYear != null && lead.year != null && lead.year < filters.minYear) {
    return false;
  }

  if (filters.regions?.length) {
    const region = (lead.region ?? '').toLowerCase();
    const text = `${lead.description ?? ''} ${lead.rawText}`.toLowerCase();
    const hit = filters.regions.some(
      (item) => region.includes(item.toLowerCase()) || text.includes(item.toLowerCase()),
    );
    if (!hit) return false;
  }

  if (filters.keywords?.length) {
    const text = `${lead.description ?? ''} ${lead.rawText}`.toLowerCase();
    const hit = filters.keywords.some((item) => text.includes(item.toLowerCase()));
    if (!hit) return false;
  }

  return true;
}
