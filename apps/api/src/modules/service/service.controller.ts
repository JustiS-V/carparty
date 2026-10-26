import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { ServiceOrdersService } from './service.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ownClientId, type RequestUser } from '../../auth/client-scope';

@Controller('service')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(
    private service: ServiceOrdersService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  async findAll(@Req() req: { user: RequestUser }) {
    return this.service.findAll(await ownClientId(this.prisma, req.user));
  }

  @Post()
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  async create(@Req() req: { user: RequestUser }, @Body() body: { clientId: string; vehicleId: string; description?: string }) {
    const own = await ownClientId(this.prisma, req.user);
    return this.service.create({ ...body, clientId: own ?? body.clientId }, own);
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: { status: string; finalCost?: number }) {
    return this.service.updateStatus(id, body.status, body.finalCost);
  }
}
