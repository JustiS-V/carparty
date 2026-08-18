/**
 * UA Telegram-канали для моніторингу авто-ринку.
 * Додайте свої канали в TELEGRAM_CHANNELS або розкоментуйте потрібні.
 */
export interface UaChannel {
  id: string;
  name: string;
  category: 'copart' | 'import' | 'auction' | 'used' | 'parts' | 'general';
  note?: string;
}

export const UA_TELEGRAM_CHANNELS: UaChannel[] = [
  { id: '@copart_ua', name: 'Copart UA', category: 'copart', note: 'Аукціони Copart' },
  { id: '@iaai_ukraine', name: 'IAAI Ukraine', category: 'auction' },
  { id: '@auto_usa_ua', name: 'Auto USA UA', category: 'import', note: 'Пригон з США' },
  { id: '@americancars_ua', name: 'American Cars UA', category: 'import' },
  { id: '@autoria_hot', name: 'AUTO.RIA Hot Deals', category: 'used' },
  { id: '@olx_auto_ua', name: 'OLX Auto UA', category: 'used' },
  { id: '@avto_bazar_ua', name: 'Авто Бazar UA', category: 'used' },
  { id: '@car_auction_ua', name: 'Car Auction UA', category: 'auction' },
  { id: '@auto_parts_ua', name: 'Auto Parts UA', category: 'parts' },
  { id: '@vin_check_ua', name: 'VIN Check UA', category: 'general' },
];

export function resolveTelegramChannels(envChannels?: string): string[] {
  const fromEnv = (envChannels ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv.length) return fromEnv;

  return UA_TELEGRAM_CHANNELS.map((channel) => channel.id);
}

export function channelsByCategory(category: UaChannel['category']): UaChannel[] {
  return UA_TELEGRAM_CHANNELS.filter((channel) => channel.category === category);
}
