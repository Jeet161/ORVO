import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.status !== 'APPROVED') {
      throw new NotFoundException('Product not found.');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Only ${product.stock} items left.`);
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestException(`Insufficient stock. Total cart quantity would exceed stock limit of ${product.stock}.`);
      }

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Item not found in cart.');
    }

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (product && product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Only ${product.stock} items left.`);
    }

    return this.prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Item not found in cart.');
    }

    await this.prisma.cartItem.delete({
      where: { id: existingItem.id },
    });

    return { success: true };
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { success: true };
  }
}
