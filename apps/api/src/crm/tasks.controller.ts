import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CrmModule, UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards/roles.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private service: TasksService) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      module: CrmModule;
      assigneeId?: string;
      createdById: string;
    },
  ) {
    return this.service.create(body);
  }

  @Patch(':id/done')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  markDone(@Param('id') id: string) {
    return this.service.markDone(id);
  }
}
