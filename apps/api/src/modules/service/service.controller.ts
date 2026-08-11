import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { ServiceOrdersService } from './service.service';

@Controller('service')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private service: ServiceOrdersService) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  create(@Body() body: { clientId: string; vehicleId: string; description?: string }) {
    return this.service.create(body);
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: { status: string; finalCost?: number }) {
    return this.service.updateStatus(id, body.status, body.finalCost);
  }
}
