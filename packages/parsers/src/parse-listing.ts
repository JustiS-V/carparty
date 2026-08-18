import type { ExternalSource, ParsedListing } from '@carparty/types';
import {
  cleanDescription,
  extractLinks,
  extractMakeModel,
  extractPrice,
  extractYear,
} from './extractors';
import { isLikelyCarListing, isMarketplaceLink } from './heuristics';
import { detectUaMarketplace, extractRegion } from './ua-market';

type ParserFn = (text: string, links: string[]) => Partial<ParsedListing>;

const telegramParser: ParserFn = (text, links) => {
  const tmeLinks = links.filter((link) => link.includes('t.me/') || link.includes('telegram.me/'));
  return {
    metadata: {
      telegramLinks: tmeLinks,
      hasForwardedContent: /Forwarded from|Переслано из/i.test(text),
    },
  };
};

const threadsParser: ParserFn = (_text, links) => ({
  links: links.filter((link) => link.includes('threads.net')),
  metadata: { platform: 'threads' },
});

const instagramParser: ParserFn = (_text, links) => ({
  links: links.filter((link) => link.includes('instagram.com')),
  mediaUrls: links.filter((link) => /instagram\.com\/(p|reel|tv)\//i.test(link)),
  metadata: { platform: 'instagram' },
});

const facebookParser: ParserFn = (text, links) => ({
  links: links.filter(
    (link) =>
      link.includes('facebook.com') ||
      link.includes('fb.com') ||
      link.includes('fb.watch'),
  ),
  metadata: {
    platform: 'facebook',
    isMarketplace: /marketplace|facebook\.com\/marketplace/i.test(`${text} ${links.join(' ')}`),
  },
});

const marketplaceParser: ParserFn = (_text, links) => ({
  links: links.filter(isMarketplaceLink),
  metadata: { platform: 'marketplace' },
});

const autoRiaParser: ParserFn = (_text, links) => ({
  links: links.filter((link) => link.includes('auto.ria.com') || link.includes('autoria.com')),
  metadata: { platform: 'auto.ria', market: 'UA' },
});

const olxUaParser: ParserFn = (_text, links) => ({
  links: links.filter((link) => link.includes('olx.ua')),
  metadata: { platform: 'olx.ua', market: 'UA' },
});

const sourceParsers: Partial<Record<ExternalSource, ParserFn>> = {
  TELEGRAM: telegramParser,
  THREADS: threadsParser,
  INSTAGRAM: instagramParser,
  FACEBOOK: facebookParser,
  MARKETPLACE: marketplaceParser,
  AUTO_RIA: autoRiaParser,
  OLX_UA: olxUaParser,
};

export function parseListing(source: ExternalSource, rawText: string): ParsedListing {
  const links = extractLinks(rawText);
  const { price, currency } = extractPrice(rawText);
  const year = extractYear(rawText);
  const { make, model } = extractMakeModel(rawText);
  const sourceSpecific = sourceParsers[source]?.(rawText, links) ?? {};

  const mergedLinks = [...new Set([...links, ...(sourceSpecific.links ?? [])])];
  const description = cleanDescription(rawText);

  const region = extractRegion(rawText);
  const uaLink = mergedLinks.map(detectUaMarketplace).find(Boolean);

  const parsed: ParsedListing = {
    description,
    price,
    currency: currency ?? (uaLink ? 'UAH' : currency),
    make,
    model,
    year,
    region,
    links: mergedLinks,
    mediaUrls: sourceSpecific.mediaUrls ?? [],
    isCarListing: false,
    metadata: {
      source,
      market: 'UA',
      uaPlatform: uaLink,
      extractedAt: new Date().toISOString(),
      ...(sourceSpecific.metadata ?? {}),
    },
  };

  parsed.isCarListing = isLikelyCarListing(rawText, parsed);
  return parsed;
}
