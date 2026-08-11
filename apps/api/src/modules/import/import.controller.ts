import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private service: ImportService) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  create(@Body() body: { clientId: string; budget?: number; notes?: string }) {
    return this.service.create(body);
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }
}
