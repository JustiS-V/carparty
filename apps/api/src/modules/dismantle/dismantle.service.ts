import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class DismantleService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  findAllJobs() {
    return this.prisma.client.dismantleJob.findMany({
      include: { vehicle: true, parts: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findParts() {
    return this.prisma.client.part.findMany({
      where: { isSold: false },
      include: { dismantleJob: { include: { vehicle: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createJob(vehicleId: string) {
    return this.prisma.client.dismantleJob.create({
      data: { vehicleId },
      include: { vehicle: true },
    });
  }

  addPart(data: { dismantleJobId: string; name: string; category: string; price?: number }) {
    return this.prisma.client.part.create({ data });
  }

  async markPartSold(id: string) {
    const part = await this.prisma.client.part.update({
      where: { id },
      data: { isSold: true },
    });

    await this.analytics.track({
      metric: 'parts.sold',
      value: 1,
      dimensions: { part_id: id, category: part.category },
    });

    return part;
  }
}
