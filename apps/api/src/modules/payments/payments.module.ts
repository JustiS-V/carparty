import { Module } from '@nestjs/common';
import { LiqPayService } from './liqpay.service';
import { MonobankService } from './monobank.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [LiqPayService, MonobankService],
  exports: [LiqPayService, MonobankService],
})
export class PaymentsModule {}
