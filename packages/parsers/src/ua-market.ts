const UA_CITIES: Record<string, string> = {
  київ: 'Київ',
  kyiv: 'Київ',
  kiev: 'Київ',
  львів: 'Львів',
  lviv: 'Львів',
  одеса: 'Одеса',
  odesa: 'Одеса',
  odessa: 'Одеса',
  харків: 'Харків',
  kharkiv: 'Харків',
  дніпро: 'Дніпро',
  dnipro: 'Дніпро',
  dnepr: 'Дніпро',
  zaporizhzhia: 'Запоріжжя',
  запоріжжя: 'Запоріжжя',
  вінниця: 'Вінниця',
  vinnytsia: 'Вінниця',
  полтава: 'Полтава',
  poltava: 'Полтава',
  черкаси: 'Черкаси',
  cherkasy: 'Черкаси',
  миколаїв: 'Миколаїв',
  mykolaiv: 'Миколаїв',
  хмельницький: 'Хмельницький',
  khmelnytskyi: 'Хмельницький',
  рівне: 'Рівне',
  rivne: 'Рівне',
  тернопіль: 'Тернопіль',
  ternopil: 'Тернопіль',
  івано: 'Івано-Франківськ',
  'івано-франківськ': 'Івано-Франківськ',
  uzhorod: 'Ужгород',
  ужгород: 'Ужгород',
  чernihiv: 'Чернігів',
  чернігів: 'Чернігів',
  суми: 'Суми',
  sumy: 'Суми',
  житомир: 'Житомир',
  zhytomyr: 'Житомир',
  кропивницький: 'Кропивницький',
  kropyvnytskyi: 'Кропивницький',
};

export function extractRegion(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [key, city] of Object.entries(UA_CITIES)) {
    if (lower.includes(key)) return city;
  }

  const match = text.match(/\b(?:м\.|місто|город)\s*([А-ЯІЇЄа-яіїєA-Za-z-]+)/i);
  if (match?.[1]) {
    const normalized = match[1].trim().toLowerCase();
    return UA_CITIES[normalized] ?? match[1].trim();
  }

  return null;
}

export function detectUaMarketplace(url: string): 'AUTO_RIA' | 'OLX_UA' | null {
  const lower = url.toLowerCase();
  if (lower.includes('auto.ria.com') || lower.includes('autoria.com')) return 'AUTO_RIA';
  if (lower.includes('olx.ua')) return 'OLX_UA';
  return null;
}

export const UA_MARKETPLACE_DOMAINS = [
  'auto.ria.com',
  'autoria.com',
  'olx.ua',
  'rst.ua',
  'prom.ua',
  'planetavto.ua',
  'autobazar.eu',
];
