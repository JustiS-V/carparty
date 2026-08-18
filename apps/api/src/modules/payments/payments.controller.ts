import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { CreatePaymentDto } from './dto/payments.dto';
import { LiqPayService } from './liqpay.service';
import { MonobankService, type MonobankWebhookPayload } from './monobank.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private liqpay: LiqPayService,
    private monobank: MonobankService,
  ) {}

  @Post('liqpay/create')
  createLiqPay(@Body() body: CreatePaymentDto) {
    return this.liqpay.createCheckout(body);
  }

  @Post('liqpay/callback')
  liqPayCallback(@Body() body: { data: string; signature: string }) {
    return this.liqpay.handleCallback(body.data, body.signature);
  }

  @Post('monobank/create')
  createMonobank(@Body() body: CreatePaymentDto) {
    return this.monobank.createOrder(body);
  }

  @Post('monobank/webhook')
  monobankWebhook(@Body() body: MonobankWebhookPayload) {
    return this.monobank.handleWebhook(body);
  }

  @Post('monobank/register-webhook')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  registerMonobankWebhook(@Body() body: { publicUrl: string }) {
    return this.monobank.registerWebhook(body.publicUrl);
  }

  @Get('liqpay/status')
  paymentStatus(@Query('orderId') orderId: string) {
    return this.liqpay.getOrderStatus(orderId);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  listOrders() {
    return this.liqpay.listOrders();
  }
}
