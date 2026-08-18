import type { BotLocale } from './i18n';
import { planLabel, t } from './i18n';

const SOURCE_LABELS: Record<string, Record<BotLocale, string>> = {
  TELEGRAM: { uk: 'Telegram', en: 'Telegram' },
  AUTO_RIA: { uk: 'AUTO.RIA', en: 'AUTO.RIA' },
  OLX_UA: { uk: 'OLX', en: 'OLX' },
  FACEBOOK: { uk: 'Facebook', en: 'Facebook' },
  INSTAGRAM: { uk: 'Instagram', en: 'Instagram' },
  MARKETPLACE: { uk: 'Маркетплейс', en: 'Marketplace' },
  OTHER: { uk: 'Інше', en: 'Other' },
};

interface LeadView {
  source: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  currency?: string | null;
  region?: string | null;
  description?: string | null;
  rawText: string;
  sourceUrl?: string | null;
  links: unknown;
  createdAt: Date;
}

export function formatLeadMessage(
  lead: LeadView,
  options?: { preview?: boolean; locale?: BotLocale },
): string {
  const locale = options?.locale ?? 'uk';
  const lines: string[] = [];
  const source = SOURCE_LABELS[lead.source]?.[locale] ?? lead.source;
  lines.push(`🚗 <b>${source}</b> · ${lead.region ?? t(locale, 'countryDefault')}`);

  const yearSuffix = locale === 'uk' ? ' р.' : '';
  const title = [lead.make, lead.model, lead.year ? `${lead.year}${yearSuffix}` : null]
    .filter(Boolean)
    .join(' ');
  if (title) lines.push(`<b>${escapeHtml(title)}</b>`);

  if (lead.price) {
    lines.push(`💰 <b>${formatPrice(lead.price, lead.currency ?? 'UAH', locale)}</b>`);
  }

  const text = lead.description ?? lead.rawText;
  const limit = options?.preview ? 280 : 600;
  lines.push(escapeHtml(truncate(text, limit)));

  if (lead.sourceUrl) {
    lines.push(`\n🔗 <a href="${lead.sourceUrl}">${t(locale, 'openSource')}</a>`);
  }

  const links = Array.isArray(lead.links) ? (lead.links as string[]) : [];
  const extra = links.filter((link) => link !== lead.sourceUrl).slice(0, 2);
  for (const link of extra) {
    lines.push(`📎 <a href="${link}">${escapeHtml(shortenUrl(link))}</a>`);
  }

  const dateLocale = locale === 'uk' ? 'uk-UA' : 'en-GB';
  lines.push(`\n<i>${lead.createdAt.toLocaleString(dateLocale)}</i>`);
  return lines.join('\n');
}

function formatPrice(price: number, currency: string, locale: BotLocale): string {
  const loc = locale === 'uk' ? 'uk-UA' : 'en-GB';
  return `${price.toLocaleString(loc)} ${currency}`;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function shortenUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').slice(0, 48);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
