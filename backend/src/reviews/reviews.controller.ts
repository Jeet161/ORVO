import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Post('product/:productId')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    return this.reviewsService.createReview(userId, productId, rating, comment);
  }
}
