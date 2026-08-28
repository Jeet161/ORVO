import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@GetUser('id') userId: string) {
    return this.cartService.getOrCreateCart(userId);
  }

  @Post('items')
  async addItem(
    @GetUser('id') userId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.addItem(userId, productId, quantity);
  }

  @Put('items/:productId')
  async updateItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(userId, productId, quantity);
  }

  @Delete('items/:productId')
  async removeItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete()
  async clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
