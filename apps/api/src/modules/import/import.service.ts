import { Injectable } from '@nestjs/common';
import { ImportStatus } from '@carparty/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  findAll() {
    return this.prisma.client.importRequest.findMany({
      include: { client: { include: { user: { select: { name: true, email: true } } } }, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.client.importRequest.findUnique({
      where: { id },
      include: { client: true, vehicle: true },
    });
  }

  create(data: { clientId: string; budget?: number; notes?: string }) {
    return this.prisma.client.importRequest.create({
      data: {
        clientId: data.clientId,
        budget: data.budget,
        notes: data.notes,
      },
      include: { client: true },
    });
  }

  async updateStatus(id: string, status: string) {
    const updated = await this.prisma.client.importRequest.update({
      where: { id },
      data: { status: status as ImportStatus },
    });

    if (status === 'CLOSED') {
      await this.analytics.track({
        metric: 'import.completed',
        value: 1,
        dimensions: { import_id: id },
      });
    }

    return updated;
  }
}
