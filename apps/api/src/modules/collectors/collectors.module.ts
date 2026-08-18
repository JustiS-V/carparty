import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { CollectorsController } from './collectors.controller';
import { CollectorsService } from './collectors.service';
import { CollectorApiKeyGuard } from './guards/collector-api-key.guard';

@Module({
  imports: [AnalyticsModule],
  controllers: [CollectorsController],
  providers: [CollectorsService, CollectorApiKeyGuard],
  exports: [CollectorsService],
})
export class CollectorsModule {}
