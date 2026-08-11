import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { ServiceController } from './service.controller';
import { ServiceOrdersService } from './service.service';

@Module({
  imports: [forwardRef(() => AnalyticsModule)],
  controllers: [ServiceController],
  providers: [ServiceOrdersService],
})
export class ServiceModule {}
