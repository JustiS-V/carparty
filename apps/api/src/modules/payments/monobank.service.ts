import { Injectable } from '@nestjs/common';
import { BotPlan, prisma } from '@carparty/database';
import { AnalyticsService } from '../../analytics/analytics.service';
import { CreatePaymentDto } from './dto/payments.dto';
import { activateSubscription } from './payment-activation.util';

const PLAN_PRICES: Record<'BASIC' | 'PRO', number> = {
  BASIC: 299,
  PRO: 599,
};

const JAR_URL = process.env.MONOBANK_JAR_URL ?? '';
const TOKEN = process.env.MONOBANK_TOKEN ?? '';

export function isMonobankConfigured(): boolean {
  return Boolean(TOKEN && JAR_URL);
}

export interface MonobankWebhookPayload {
  type: string;
  data?: {
    statementItem?: {
      id?: string;
      amount?: number;
      comment?: string;
    };
  };
}

@Injectable()
export class MonobankService {
  constructor(private analytics: AnalyticsService) {}

  async createOrder(dto: CreatePaymentDto) {
    if (!isMonobankConfigured()) {
      return { error: 'Monobank is not configured' };
    }

    const orderId = `cp_mb_${dto.telegramId}_${dto.plan}_${Date.now()}`;
    const amountUah = PLAN_PRICES[dto.plan as 'BASIC' | 'PRO'];

    await prisma.botPaymentOrder.create({
      data: {
        orderId,
        telegramId: dto.telegramId,
        plan: dto.plan as BotPlan,
        amountUah,
        provider: 'monobank',
      },
    });

    return {
      orderId,
      amountUah,
      jarUrl: JAR_URL,
      comment: orderId,
    };
  }

  async handleWebhook(body: MonobankWebhookPayload) {
    if (body.type !== 'StatementItem') {
      return { ok: true, ignored: true };
    }

    const item = body.data?.statementItem;
    if (!item?.comment || !item.amount) {
      return { ok: true, ignored: true };
    }

    const amountUah = item.amount / 100;
    if (amountUah <= 0) {
      return { ok: true, ignored: true };
    }

    const order = await prisma.botPaymentOrder.findUnique({
      where: { orderId: item.comment.trim() },
    });

    if (!order || order.status === 'paid') {
      return { ok: true, ignored: true };
    }

    if (Math.abs(amountUah - order.amountUah) > 1) {
      return { ok: false, error: 'amount mismatch' };
    }

    await activateSubscription(order.telegramId, order.plan, order.id);

    await this.analytics.track({
      metric: 'bot.payments',
      value: 1,
      dimensions: { plan: order.plan, provider: 'monobank' },
    });
    await this.analytics.track({
      metric: 'bot.revenue',
      value: order.amountUah,
      dimensions: { plan: order.plan, provider: 'monobank' },
    });

    return { ok: true, activated: order.plan, telegramId: order.telegramId };
  }

  async registerWebhook(publicUrl: string) {
    if (!TOKEN) return { error: 'MONOBANK_TOKEN not set' };

    const webhookUrl = `${publicUrl.replace(/\/$/, '')}/api/payments/monobank/webhook`;
    const response = await fetch('https://api.monobank.ua/personal/webhook', {
      method: 'POST',
      headers: {
        'X-Token': TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webHookUrl: webhookUrl }),
    });

    const text = await response.text();
    return { webhookUrl, status: response.status, body: text };
  }
}
