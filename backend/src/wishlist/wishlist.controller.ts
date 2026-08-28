import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@GetUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post(':productId')
  async addToWishlist(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.addToWishlist(userId, productId);
  }

  @Delete(':productId')
  async removeFromWishlist(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }
}
