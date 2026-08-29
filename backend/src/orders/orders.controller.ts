import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { SellersService } from '../sellers/sellers.service';
import { Role, PaymentMethod, OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private sellersService: SellersService,
  ) {}

  @Post('checkout')
  async checkout(
    @GetUser('id') userId: string,
    @Body() body: {
      addressId: string;
      paymentMethod: PaymentMethod;
      idempotencyKey?: string;
    },
  ) {
    return this.ordersService.checkout(userId, body);
  }

  @Post('buy-now')
  async buyNow(
    @GetUser('id') userId: string,
    @Body() body: {
      productId: string;
      quantity: number;
      addressId: string;
      paymentMethod: PaymentMethod;
      idempotencyKey?: string;
    },
  ) {
    return this.ordersService.buyNow(userId, body);
  }

  @Get('my-orders')
  async getBuyerOrders(@GetUser('id') userId: string) {
    return this.ordersService.getBuyerOrders(userId);
  }

  @Get('seller/my-orders')
  @Roles(Role.SELLER)
  async getSellerOrders(@GetUser('id') userId: string) {
    const seller = await this.sellersService.getSellerProfile(userId);
    return this.ordersService.getSellerOrders(seller.id);
  }

  @Get(':id')
  async getOrderDetails(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderDetails(orderId, userId, role);
  }

  @Put(':id/status')
  @Roles(Role.SELLER, Role.ADMIN)
  async updateOrderStatus(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateOrderStatus(orderId, userId, role, status);
  }
}
