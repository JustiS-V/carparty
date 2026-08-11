import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [forwardRef(() => AnalyticsModule)],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
