import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingSellers,
      pendingProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.sellerProfile.count({ where: { status: 'APPROVED' } }),
      this.prisma.product.count({ where: { status: 'APPROVED' } }),
      this.prisma.order.count(),
      this.prisma.sellerProfile.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'PENDING' } }),
    ]);

    // Total revenue from paid orders
    const revenueResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    });

    const totalRevenue = revenueResult._sum.amount ?? 0;

    return {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingSellers,
      pendingProducts,
      totalRevenue,
    };
  }

  async getPendingSellers() {
    return this.prisma.sellerProfile.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPendingProducts() {
    return this.prisma.product.findMany({
      where: { status: 'PENDING' },
      include: {
        images: true,
        category: { select: { name: true } },
        seller: { select: { shopName: true, region: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        buyer: { select: { name: true, email: true } },
        items: { include: { product: { select: { title: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
