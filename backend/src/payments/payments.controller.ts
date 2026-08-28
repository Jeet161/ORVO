import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('order/:orderId')
  async getPayment(
    @GetUser('id') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPaymentForOrder(orderId, userId);
  }

  @Post('order/:orderId/process')
  async processPayment(
    @GetUser('id') userId: string,
    @Param('orderId') orderId: string,
    @Body('transactionId') transactionId?: string,
  ) {
    return this.paymentsService.processPayment(orderId, userId, transactionId);
  }
}
