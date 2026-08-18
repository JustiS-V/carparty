const SOURCE_LABELS: Record<string, string> = {
  TELEGRAM: 'Telegram',
  AUTO_RIA: 'AUTO.RIA',
  OLX_UA: 'OLX',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  MARKETPLACE: 'Маркетплейс',
  THREADS: 'Threads',
  OTHER: 'Другое',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  PARSED: 'Разобран',
  REVIEW: 'На проверке',
  PROMOTED: 'В CRM',
  REJECTED: 'Отклонён',
  DUPLICATE: 'Дубликат',
};

export function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function formatUah(value: number) {
  return `${value.toLocaleString('uk-UA')} ₴`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uk-UA');
}

export function timeAgo(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'щойно';
  if (mins < 60) return `${mins} хв тому`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} год тому`;
  return `${Math.floor(hours / 24)} дн тому`;
}
