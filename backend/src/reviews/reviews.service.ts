import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, productId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    // Verify the buyer actually purchased this product and order was delivered
    const purchasedItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          buyerId: userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!purchasedItem) {
      throw new ForbiddenException('You can only review products you have purchased and received.');
    }

    // One review per product per user
    const existingReview = await this.prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product.');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
      include: {
        user: { select: { name: true } },
      },
    });
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    };
  }
}
