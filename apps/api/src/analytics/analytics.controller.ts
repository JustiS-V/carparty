import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@carparty/database';
import type { TrackEventPayload } from '@carparty/types';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { CreateMetricDto, QueryAnalyticsDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Post('track')
  track(@Body() body: TrackEventPayload) {
    return this.analytics.track(body);
  }

  @Post('track/batch')
  trackBatch(@Body() body: { events: TrackEventPayload[] }) {
    return this.analytics.trackBatch(body.events);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  getMetrics(@Query('module') module?: string) {
    return this.analytics.getMetrics(module);
  }

  @Post('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  registerMetric(@Body() dto: CreateMetricDto) {
    return this.analytics.registerMetric(dto);
  }

  @Put('metrics/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  updateMetric(@Param('key') key: string, @Body() dto: Partial<CreateMetricDto>) {
    return this.analytics.updateMetric(key, dto);
  }

  @Delete('metrics/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  deactivateMetric(@Param('key') key: string) {
    return this.analytics.deactivateMetric(key);
  }

  @Get('query')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  query(@Query() dto: QueryAnalyticsDto) {
    return this.analytics.query(dto as import('@carparty/types').AnalyticsQueryParams);
  }

  @Get('dashboards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  getDashboards(@Query('role') role?: UserRole) {
    return this.analytics.getDashboards(role);
  }

  @Post('dashboards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  createDashboard(
    @Body()
    body: {
      name: string;
      role: UserRole;
      module?: string;
      widgets?: Array<{
        metricKey: string;
        chartType: string;
        title: string;
        position?: object;
      }>;
    },
  ) {
    return this.analytics.createDashboard(body);
  }
}
