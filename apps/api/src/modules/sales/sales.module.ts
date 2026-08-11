import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [forwardRef(() => AnalyticsModule)],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
