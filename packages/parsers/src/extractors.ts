const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*/gi;

const PRICE_PATTERNS = [
  /\$\s?([\d\s]{1,12}(?:[.,]\d{1,2})?)\s?(?:usd|us)?/i,
  /([\d\s]{1,12}(?:[.,]\d{1,2})?)\s?\$/i,
  /([\d\s]{1,12}(?:[.,]\d{1,2})?)\s?(?:usd|дол(?:\.|ларов)?)/i,
  /([\d\s]{1,12}(?:[.,]\d{1,2})?)\s?(?:eur|€|евро)/i,
  /цена[:\s-]*([\d\s]{1,12}(?:[.,]\d{1,2})?)/i,
  /([\d\s]{1,12}(?:[.,]\d{1,2})?)\s?(?:грн|uah|₴)/i,
];

const YEAR_REGEX = /\b(19[89]\d|20[0-2]\d)\b/;

const MAKE_MODEL_PATTERNS = [
  /\b(BMW|Mercedes(?:-Benz)?|Audi|Toyota|Honda|Volkswagen|VW|Lexus|Nissan|Hyundai|Kia|Mazda|Subaru|Ford|Chevrolet|Jeep|Tesla|Porsche|Volvo|Skoda|Renault|Peugeot|Citroen|Mitsubishi|Infiniti|Acura|Cadillac|Lincoln|Buick|GMC|Ram|Dodge|Chrysler|Land Rover|Jaguar|Mini|Fiat|Alfa Romeo|Maserati|Ferrari|Lamborghini|Bentley|Rolls-Royce|Genesis|BYD|Geely|Chery|Haval|Great Wall|UAZ|VAZ|Lada|GAZ|ZAZ)\b[\s/-]+([A-Za-z0-9][A-Za-z0-9\s/-]{0,30})/i,
  /\b(БМВ|Мерседес|Ауди|Тойота|Хонда|Фольксваген|Лексус|Нissan|Хyundai|Кia|Мazda|Субaru|Фord|Шевроле|Тesla|Пorsche|Volvo|Skoda|Renault|Peugeot|Mitsubishi|Infiniti|Cadillac|Jeep|Land Rover|Jaguar|Mini|Fiat|UAZ|VAZ|Lada)\b[\s/-]+([A-Za-zА-Яа-я0-9][A-Za-zА-Яа-я0-9\s/-]{0,30})/i,
];

const KNOWN_MAKES = [
  'BMW',
  'Mercedes-Benz',
  'Mercedes',
  'Audi',
  'Toyota',
  'Honda',
  'Volkswagen',
  'VW',
  'Lexus',
  'Nissan',
  'Hyundai',
  'Kia',
  'Mazda',
  'Subaru',
  'Ford',
  'Chevrolet',
  'Jeep',
  'Tesla',
  'Porsche',
  'Volvo',
  'Skoda',
  'Renault',
  'Peugeot',
  'Mitsubishi',
  'Infiniti',
  'Acura',
  'Cadillac',
  'Land Rover',
  'Jaguar',
  'Mini',
  'Fiat',
  'UAZ',
  'Lada',
];

export function extractLinks(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[),.;!?]+$/, '')))];
}

export function extractPrice(text: string): { price: number | null; currency: string | null } {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const normalized = match[1].replace(/\s/g, '').replace(',', '.');
    const price = Number.parseFloat(normalized);
    if (!Number.isFinite(price) || price <= 0) continue;

    const snippet = match[0].toLowerCase();
    let currency = 'USD';
    if (snippet.includes('eur') || snippet.includes('€') || snippet.includes('евро')) {
      currency = 'EUR';
    } else if (snippet.includes('грн') || snippet.includes('uah') || snippet.includes('₴')) {
      currency = 'UAH';
    }

    return { price, currency };
  }

  return { price: null, currency: null };
}

export function extractYear(text: string): number | null {
  const match = text.match(YEAR_REGEX);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  return Number.isFinite(year) ? year : null;
}

export function extractMakeModel(text: string): { make: string | null; model: string | null } {
  for (const pattern of MAKE_MODEL_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    const make = normalizeMake(match[1]);
    const model = cleanupModel(match[2]);
    if (make && model) return { make, model };
  }

  for (const make of KNOWN_MAKES) {
    const regex = new RegExp(`\\b${make.replace('-', '[-\\s]?')}\\b`, 'i');
    if (regex.test(text)) {
      return { make: normalizeMake(make), model: null };
    }
  }

  return { make: null, model: null };
}

export function cleanDescription(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeMake(value: string): string {
  const map: Record<string, string> = {
    vw: 'Volkswagen',
    бмв: 'BMW',
    мерседес: 'Mercedes-Benz',
    ауди: 'Audi',
    тойота: 'Toyota',
    хонда: 'Honda',
    фольксваген: 'Volkswagen',
    лексус: 'Lexus',
    vaz: 'Lada',
    uaz: 'UAZ',
  };

  const key = value.trim().toLowerCase();
  return map[key] ?? value.trim().replace(/\s+/g, ' ');
}

function cleanupModel(value: string): string | null {
  const cleaned = value
    .replace(/\b(г\.?|год|year)\b.*$/i, '')
    .replace(/[,.;:]+$/, '')
    .trim();

  return cleaned.length >= 1 ? cleaned : null;
}
