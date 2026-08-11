import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { DismantleController } from './dismantle.controller';
import { DismantleService } from './dismantle.service';

@Module({
  imports: [forwardRef(() => AnalyticsModule)],
  controllers: [DismantleController],
  providers: [DismantleService],
})
export class DismantleModule {}
