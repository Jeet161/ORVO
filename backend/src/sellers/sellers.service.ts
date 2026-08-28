import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SellerStatus, Role } from '@prisma/client';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async applyAsSeller(userId: string, data: {
    shopName: string;
    shopSlug: string;
    region: string;
    bio?: string;
    businessLicenseUrl: string;
    idProofUrl: string;
  }) {
    // Check if user already has a seller profile or application
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === SellerStatus.PENDING) {
        throw new ConflictException('You already have a pending seller application.');
      }
      if (existing.status === SellerStatus.APPROVED) {
        throw new ConflictException('You are already an approved seller.');
      }
      // If rejected, they can apply again (we will delete their old profile and create a new one, or update it)
      return this.prisma.sellerProfile.update({
        where: { userId },
        data: {
          shopName: data.shopName,
          shopSlug: data.shopSlug,
          region: data.region,
          bio: data.bio,
          businessLicenseUrl: data.businessLicenseUrl,
          idProofUrl: data.idProofUrl,
          status: SellerStatus.PENDING,
          rejectionReason: null,
          isVerified: false,
        },
      });
    }

    // Check slug uniqueness
    const existingSlug = await this.prisma.sellerProfile.findUnique({
      where: { shopSlug: data.shopSlug },
    });
    if (existingSlug) {
      throw new ConflictException('Shop slug is already in use.');
    }

    return this.prisma.sellerProfile.create({
      data: {
        ...data,
        userId,
        status: SellerStatus.PENDING,
      },
    });
  }

  async getSellerProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }
    return profile;
  }

  async listPendingApplications() {
    return this.prisma.sellerProfile.findMany({
      where: { status: SellerStatus.PENDING },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewApplication(applicationId: string, status: SellerStatus, rejectionReason?: string) {
    if (status !== SellerStatus.APPROVED && status !== SellerStatus.REJECTED) {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }

    const application = await this.prisma.sellerProfile.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException('Seller application not found');
    }

    const [updatedSeller] = await this.prisma.$transaction([
      this.prisma.sellerProfile.update({
        where: { id: applicationId },
        data: {
          status,
          rejectionReason: status === SellerStatus.REJECTED ? rejectionReason : null,
          isVerified: status === SellerStatus.APPROVED,
        },
      }),
      this.prisma.user.update({
        where: { id: application.userId },
        data: {
          role: status === SellerStatus.APPROVED ? Role.SELLER : Role.BUYER,
        },
      }),
      // Create notification
      this.prisma.notification.create({
        data: {
          userId: application.userId,
          title: status === SellerStatus.APPROVED ? 'Seller Application Approved!' : 'Seller Application Rejected',
          message: status === SellerStatus.APPROVED
            ? `Congratulations, your shop "${application.shopName}" has been approved. You can now list products.`
            : `Your application was rejected. Reason: ${rejectionReason || 'No reason provided.'}`,
        },
      }),
    ]);

    return updatedSeller;
  }

  async getSellerAnalytics(sellerId: string) {
    // 1. Total revenue (completed/paid orders containing this seller's products)
    const paidItems = await this.prisma.orderItem.findMany({
      where: {
        sellerId,
        order: {
          paymentStatus: 'PAID',
        },
      },
      select: {
        subtotal: true,
        quantity: true,
      },
    });

    const totalSales = paidItems.reduce((sum, item) => sum + item.subtotal, 0);
    const productsSold = paidItems.reduce((sum, item) => sum + item.quantity, 0);

    // 2. Total orders list
    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            paymentStatus: true,
          },
        },
      },
    });

    const uniqueOrders = new Set(orderItems.map(item => item.orderId));
    const totalOrdersCount = uniqueOrders.size;

    // 3. Pending/processing orders count for this seller
    const pendingOrdersItems = await this.prisma.orderItem.findMany({
      where: {
        sellerId,
        order: {
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
        },
      },
    });
    const pendingOrdersCount = new Set(pendingOrdersItems.map(item => item.orderId)).size;

    // 4. Products count
    const totalProductsCount = await this.prisma.product.count({
      where: { sellerId },
    });

    const avgOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

    return {
      totalSales,
      totalOrders: totalOrdersCount,
      productsSold,
      avgOrderValue,
      pendingOrders: pendingOrdersCount,
      totalProducts: totalProductsCount,
    };
  }
}
