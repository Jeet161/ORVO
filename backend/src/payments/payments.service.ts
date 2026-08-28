import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentForOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order.payments[0] ?? null;
  }

  async processPayment(orderId: string, userId: string, transactionId?: string) {
    // Fetch the order
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException('Order not found.');
    if (order.payments.length === 0) throw new BadRequestException('No payment record found for this order.');

    const payment = order.payments[0];

    // Idempotency - if already paid, return existing
    if (payment.status === PaymentStatus.PAID) {
      return { payment, order };
    }

    // Idempotency by transactionId
    if (transactionId) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { transactionId },
      });
      if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
        return { payment: existingPayment, order };
      }
    }

    // Mock payment processing - simulate a 90% success rate
    const mockTransactionId = transactionId ?? `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const isSuccess = true; // Always succeed for demo purposes

    if (isSuccess) {
      const [updatedPayment, updatedOrder] = await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            transactionId: mockTransactionId,
          },
        }),
        this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.CONFIRMED,
          },
        }),
      ]);

      // Buyer notification
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Payment Successful!',
          message: `Payment of ₹${payment.amount} was successful. Order #${orderId.slice(0, 8)} is confirmed.`,
        },
      });

      return { payment: updatedPayment, order: updatedOrder };
    } else {
      const [updatedPayment] = await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        }),
        this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        }),
      ]);

      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Payment Failed',
          message: `Your payment for order #${orderId.slice(0, 8)} failed. Please try again.`,
        },
      });

      return { payment: updatedPayment, success: false };
    }
  }
}
