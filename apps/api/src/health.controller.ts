import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/** Public liveness probe for the hosting platform: process up and database reachable. */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.client.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
