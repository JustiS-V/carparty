import { Injectable, ServiceUnavailableException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'crypto';
import { BotPlan, prisma } from '@carparty/database';
import { CreatePaymentDto } from './dto/payments.dto';

/** Stripe is owned by Capitolium Billing; no Stripe secrets are stored in CarParty. */
@Injectable()
export class StripeBillingService {
  private config() {
    const base = process.env.CAPITOLIUM_BILLING_URL;
    const key = process.env.CAPITOLIUM_PRODUCT_KEY;
    if (!base || !key) throw new ServiceUnavailableException('Capitolium Billing is not configured');
    return { base: base.replace(/\/$/, ''), key };
  }

  async createCheckout(dto: CreatePaymentDto) {
    if (!/^\d{1,30}$/.test(dto.telegramId) || !['BASIC', 'PRO'].includes(dto.plan)) {
      throw new BadRequestException('Invalid Telegram account or plan');
    }
    const { base, key } = this.config();
    const requestId = randomUUID();
    // Existing order table remains the source of bot entitlement identity.
    await prisma.botPaymentOrder.create({ data: {
      orderId: requestId, telegramId: dto.telegramId, plan: dto.plan as BotPlan,
      amountUah: 0, status: 'stripe_pending',
    } });
    const response = await fetch(`${base}/internal/checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Product-Key': key },
      body: JSON.stringify({ product: 'carparty', plan: dto.plan, owner: `carparty:${dto.telegramId}`, request_id: requestId }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new ServiceUnavailableException('Stripe checkout is unavailable; no payment was confirmed');
    const result = await response.json() as { url: string };
    return { orderId: requestId, checkoutUrl: result.url, provider: 'stripe' };
  }

  async fulfill(orderId: string, suppliedKey?: string) {
    const { base, key } = this.config();
    const a = Buffer.from(key), b = Buffer.from(suppliedKey || '');
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException();
    if (!/^[a-f0-9-]{36}$/.test(orderId || '')) throw new BadRequestException('Invalid order');
    const response = await fetch(`${base}/internal/orders/${orderId}`, {
      headers: { 'X-Product-Key': key }, signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new ServiceUnavailableException('Cannot verify billing order');
    const event = await response.json() as { product: string; owner: string; plan: string; state: string };
    const order = await prisma.botPaymentOrder.findUnique({ where: { orderId } });
    if (!order || event.product !== 'carparty' || event.owner !== `carparty:${order.telegramId}` || event.plan !== order.plan) {
      throw new BadRequestException('Payment identity mismatch');
    }
    if (event.state === 'refunded') {
      await prisma.botPaymentOrder.updateMany({ where: { id: order.id, status: 'paid' }, data: { status: 'stripe_refund_review' } });
      return { ok: false, state: 'refunded', requiresReview: true };
    }
    if (event.state !== 'paid') return { ok: true, state: event.state };
    await prisma.$transaction(async tx => {
      // Atomic claim prevents redelivered webhooks from extending a subscription twice.
      const claimed = await tx.botPaymentOrder.updateMany({
        where: { id: order.id, status: 'stripe_pending' }, data: { status: 'paid', paidAt: new Date() },
      });
      if (!claimed.count) return;
      const existing = await tx.botSubscriber.findUnique({ where: { telegramId: order.telegramId } });
      const expiresAt = new Date(Math.max(Date.now(), existing?.expiresAt?.getTime() || 0) + 30 * 86400000);
      await tx.botSubscriber.upsert({
        where: { telegramId: order.telegramId },
        update: { plan: order.plan, expiresAt, trialExpiresAt: null },
        create: { telegramId: order.telegramId, plan: order.plan, expiresAt },
      });
    });
    return { ok: true };
  }
}
