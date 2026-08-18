import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { BotPlan, UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { BotAdminService } from './bot-admin.service';
import { ActivateSubscriberDto } from './dto/bot-admin.dto';

@Controller('bot')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class BotAdminController {
  constructor(private service: BotAdminService) {}

  @Get('stats')
  stats() {
    return this.service.getStats();
  }

  @Get('subscribers')
  subscribers() {
    return this.service.listSubscribers();
  }

  @Patch('subscribers/:id/activate')
  activate(@Param('id') id: string, @Body() body: ActivateSubscriberDto) {
    return this.service.activateSubscriber(id, body.plan, body.days ?? 30);
  }

  @Get('deliveries')
  deliveries() {
    return this.service.recentDeliveries();
  }
}
