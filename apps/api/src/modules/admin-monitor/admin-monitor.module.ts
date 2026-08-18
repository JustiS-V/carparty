import { Module } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminMonitorController } from './admin-monitor.controller';
import { AdminMonitorService } from './admin-monitor.service';

@Module({
  controllers: [AdminMonitorController],
  providers: [AdminMonitorService, AdminAnalyticsService],
})
export class AdminMonitorModule {}
