import { Controller, Get, Param, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { DismantleService } from './dismantle.service';

@Controller('dismantle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DismantleController {
  constructor(private service: DismantleService) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findAll() {
    return this.service.findAllJobs();
  }

  @Get('parts')
  findParts() {
    return this.service.findParts();
  }

  @Post('jobs')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  createJob(@Body() body: { vehicleId: string }) {
    return this.service.createJob(body.vehicleId);
  }

  @Post('parts')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  addPart(@Body() body: { dismantleJobId: string; name: string; category: string; price?: number }) {
    return this.service.addPart(body);
  }

  @Patch('parts/:id/sold')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  markSold(@Param('id') id: string) {
    return this.service.markPartSold(id);
  }
}
