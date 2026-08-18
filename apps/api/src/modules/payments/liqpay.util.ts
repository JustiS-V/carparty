import { createHash } from 'crypto';
import { BotPlan } from '@carparty/database';

const PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY ?? '';
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY ?? '';
const CALLBACK_URL = process.env.LIQPAY_CALLBACK_URL ?? 'http://localhost:4000/api/payments/liqpay/callback';
const RESULT_URL = process.env.LIQPAY_RESULT_URL ?? 'https://t.me/carparty_ua_bot';

export function isLiqPayConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export interface LiqPayCheckoutParams {
  version: number;
  public_key: string;
  action: 'pay';
  amount: number;
  currency: 'UAH';
  description: string;
  order_id: string;
  result_url: string;
  server_url: string;
  info: string;
}

export function buildCheckoutParams(input: {
  orderId: string;
  amountUah: number;
  description: string;
  info: string;
}): LiqPayCheckoutParams {
  return {
    version: 3,
    public_key: PUBLIC_KEY,
    action: 'pay',
    amount: input.amountUah,
    currency: 'UAH',
    description: input.description,
    order_id: input.orderId,
    result_url: RESULT_URL,
    server_url: CALLBACK_URL,
    info: input.info,
  };
}

export function encodePayload(params: LiqPayCheckoutParams): string {
  return Buffer.from(JSON.stringify(params)).toString('base64');
}

export function signPayload(data: string): string {
  return createHash('sha1').update(PRIVATE_KEY + data + PRIVATE_KEY).digest('base64');
}

export function buildCheckoutUrl(params: LiqPayCheckoutParams): string {
  const data = encodePayload(params);
  const signature = signPayload(data);
  return `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
}

export function verifyCallback(data: string, signature: string): boolean {
  return signPayload(data) === signature;
}

export function decodeCallback<T>(data: string): T {
  return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as T;
}

export interface LiqPayCallbackData {
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  info?: string;
}

export function planFromOrderInfo(info?: string): BotPlan | null {
  if (!info) return null;
  const upper = info.toUpperCase();
  if (upper.includes('PRO')) return BotPlan.PRO;
  if (upper.includes('BASIC')) return BotPlan.BASIC;
  return null;
}
