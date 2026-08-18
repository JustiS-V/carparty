import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminMonitorService } from './admin-monitor.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminMonitorController {
  constructor(
    private service: AdminMonitorService,
    private analytics: AdminAnalyticsService,
  ) {}

  @Get('overview')
  overview() {
    return this.service.getOverview();
  }

  @Get('health')
  health() {
    return this.service.healthCheck();
  }

  @Get('analytics/daily')
  dailyAnalytics(@Query('days') days?: string) {
    const parsed = Number(days) || 30;
    return this.analytics.getDailySeries(Math.min(Math.max(parsed, 7), 90));
  }
}
