import { Injectable } from '@nestjs/common';
import { SaleStatus } from '@carparty/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  findListings() {
    return this.prisma.client.saleListing.findMany({
      where: { status: SaleStatus.LISTED },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findListing(id: string) {
    return this.prisma.client.saleListing.findUnique({
      where: { id },
      include: { vehicle: true },
    });
  }

  async trackView(id: string) {
    await this.prisma.client.saleListing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    await this.analytics.track({
      metric: 'listing.views',
      value: 1,
      dimensions: { listing_id: id, source: 'catalog' },
    });
  }

  async trackClick(id: string, target: string) {
    await this.prisma.client.saleListing.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    await this.analytics.track({
      metric: 'listing.clicks',
      value: 1,
      dimensions: { listing_id: id, target },
    });

    return { ok: true };
  }

  createListing(data: { vehicleId: string; price: number; description?: string }) {
    return this.prisma.client.saleListing.create({
      data: {
        ...data,
        status: SaleStatus.LISTED,
        publishedAt: new Date(),
      },
      include: { vehicle: true },
    });
  }

  createDeal(data: { saleListingId: string; clientId: string; amount: number }) {
    return this.prisma.client.deal.create({ data });
  }

  async closeDeal(id: string) {
    const deal = await this.prisma.client.deal.update({
      where: { id },
      data: { status: 'closed', closedAt: new Date() },
      include: { saleListing: true },
    });

    await this.prisma.client.saleListing.update({
      where: { id: deal.saleListingId },
      data: { status: SaleStatus.SOLD },
    });

    await this.analytics.track({
      metric: 'sales.count',
      value: 1,
      dimensions: { deal_id: id },
    });

    await this.analytics.track({
      metric: 'sales.revenue',
      value: deal.amount,
      dimensions: { deal_id: id },
    });

    return deal;
  }
}
