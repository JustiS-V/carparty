import { Injectable } from '@nestjs/common';
import { BotPlan, prisma } from '@carparty/database';
import { AnalyticsService } from '../../analytics/analytics.service';
import { CreatePaymentDto } from './dto/payments.dto';
import { activateSubscription } from './payment-activation.util';
import {
  buildCheckoutParams,
  buildCheckoutUrl,
  decodeCallback,
  isLiqPayConfigured,
  planFromOrderInfo,
  verifyCallback,
  type LiqPayCallbackData,
} from './liqpay.util';

const PLAN_PRICES: Record<'BASIC' | 'PRO', number> = {
  BASIC: 299,
  PRO: 599,
};

@Injectable()
export class LiqPayService {
  constructor(private analytics: AnalyticsService) {}
  createCheckout(dto: CreatePaymentDto) {
    if (!isLiqPayConfigured()) {
      return { error: 'LiqPay is not configured', manual: true };
    }

    const orderId = `cp_${dto.telegramId}_${dto.plan}_${Date.now()}`;
    const amountUah = PLAN_PRICES[dto.plan as 'BASIC' | 'PRO'];

    return prisma.botPaymentOrder
      .create({
        data: {
          orderId,
          telegramId: dto.telegramId,
          plan: dto.plan as BotPlan,
          amountUah,
        },
      })
      .then((order) => {
        const params = buildCheckoutParams({
          orderId: order.orderId,
          amountUah: order.amountUah,
          description: `CarParty UA — ${dto.plan}`,
          info: `${dto.telegramId}:${dto.plan}`,
        });

        return {
          orderId: order.orderId,
          amountUah: order.amountUah,
          checkoutUrl: buildCheckoutUrl(params),
        };
      });
  }

  async handleCallback(data: string, signature: string) {
    if (!verifyCallback(data, signature)) {
      return { ok: false, error: 'invalid signature' };
    }

    const payload = decodeCallback<LiqPayCallbackData>(data);
    if (payload.status !== 'success' && payload.status !== 'sandbox') {
      await prisma.botPaymentOrder.updateMany({
        where: { orderId: payload.order_id },
        data: { status: payload.status },
      });
      return { ok: true, status: payload.status };
    }

    const order = await prisma.botPaymentOrder.findUnique({
      where: { orderId: payload.order_id },
    });

    if (!order) return { ok: false, error: 'order not found' };

    const plan = planFromOrderInfo(payload.info) ?? order.plan;

    await activateSubscription(order.telegramId, plan, order.id);

    await this.analytics.track({
      metric: 'bot.payments',
      value: 1,
      dimensions: { plan },
    });
    await this.analytics.track({
      metric: 'bot.revenue',
      value: order.amountUah,
      dimensions: { plan },
    });

    return { ok: true, activated: plan, telegramId: order.telegramId };
  }

  getOrderStatus(orderId: string) {
    return prisma.botPaymentOrder.findUnique({ where: { orderId } });
  }

  listOrders() {
    return prisma.botPaymentOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
