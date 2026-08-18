import type { ParsedListing } from '@carparty/types';
import { UA_MARKETPLACE_DOMAINS } from './ua-market';

export function isMarketplaceLink(url: string): boolean {
  const lower = url.toLowerCase();
  const domains = [
    'copart.com',
    'iaai.com',
    'manheim.com',
    'auto.ru',
    'avito.ru',
    'drom.ru',
    ...UA_MARKETPLACE_DOMAINS,
    'mobile.de',
    'autotrader.com',
    'cars.com',
    'facebook.com/marketplace',
    'instagram.com',
    'threads.net',
    'bringatrailer.com',
    'carsandbids.com',
  ];

  return domains.some((domain) => lower.includes(domain));
}

export function isLikelyCarListing(text: string, parsed: ParsedListing): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'продам',
    'продаю',
    'продажа',
    'auto',
    'авто',
    'машин',
    'bmw',
    'mercedes',
    'audi',
    'toyota',
    'honda',
    'volkswagen',
    'lexus',
    'vin',
    'пробег',
    'км',
    'цена',
    'торг',
    '$',
    'usd',
    'eur',
    'copart',
    'iaai',
    'manheim',
    'auto.ria',
    'olx',
    'авторia',
    'авторія',
    'б/u',
    'б/у',
    'пробіг',
    'двигун',
    'коробка',
    'тип кузова',
  ];

  const hasKeyword = keywords.some((word) => lower.includes(word));
  const hasCarSignal =
    parsed.year !== null ||
    parsed.make !== null ||
    parsed.price !== null ||
    parsed.links.some((link) => isMarketplaceLink(link));

  return hasKeyword || hasCarSignal;
}
