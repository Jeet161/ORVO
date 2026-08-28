import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWishlist(userId: string, productId: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product is already in your wishlist.');
    }

    return this.prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Product is not in your wishlist.');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }
}
