import { StripeBillingService } from './stripe-billing.service';
import { Module } from '@nestjs/common';
import { LiqPayService } from './liqpay.service';
import { MonobankService } from './monobank.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [LiqPayService, MonobankService, StripeBillingService],
  exports: [LiqPayService, MonobankService],
})
export class PaymentsModule {}
