import { ForbiddenException, Injectable } from '@nestjs/common';
import { ServiceStatus } from '@carparty/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  /** clientId set = only that client's orders (a client's own view). */
  findAll(clientId: string | null = null) {
    return this.prisma.client.serviceOrder.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: { include: { user: { select: { name: true } } } },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { clientId: string; vehicleId: string; description?: string }, ownClient: string | null = null) {
    if (ownClient) {
      const vehicle = await this.prisma.client.vehicle.findUnique({ where: { id: data.vehicleId }, select: { clientId: true } });
      if (!vehicle || (vehicle.clientId && vehicle.clientId !== ownClient)) throw new ForbiddenException('Not your vehicle');
    }
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
