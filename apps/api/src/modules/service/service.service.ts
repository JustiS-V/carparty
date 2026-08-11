import { Injectable } from '@nestjs/common';
import { ServiceStatus } from '@carparty/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  findAll() {
    return this.prisma.client.serviceOrder.findMany({
      include: {
        client: { include: { user: { select: { name: true } } } },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { clientId: string; vehicleId: string; description?: string }) {
    const order = await this.prisma.client.serviceOrder.create({
      data,
      include: { vehicle: true },
    });

    await this.analytics.track({
      metric: 'service.orders',
      value: 1,
      dimensions: { order_id: order.id },
    });

    return order;
  }

  async updateStatus(id: string, status: string, finalCost?: number) {
    const updated = await this.prisma.client.serviceOrder.update({
      where: { id },
      data: {
        status: status as ServiceStatus,
        finalCost,
        finishedAt: status === 'DELIVERED' ? new Date() : undefined,
      },
    });

    if (status === 'DELIVERED' && finalCost) {
      await this.analytics.track({
        metric: 'service.revenue',
        value: finalCost,
        dimensions: { order_id: id },
      });
    }

    return updated;
  }
}
