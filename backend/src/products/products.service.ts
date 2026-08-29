import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── Public: list approved products with filters ─────────────────────────────
  async getPublicProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerRegion?: string;
    search?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
  }) {
    const { category, minPrice, maxPrice, sellerRegion, search, sortBy } = filters;

    // Build price range filter only when values are provided
    const priceFilter: any = {};
    if (minPrice !== undefined && minPrice !== null && !isNaN(Number(minPrice))) {
      priceFilter.gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(Number(maxPrice))) {
      priceFilter.lte = Number(maxPrice);
    }

    const orderBy: any =
      sortBy === 'price_asc'
        ? { price: 'asc' }
        : sortBy === 'price_desc'
        ? { price: 'desc' }
        : { createdAt: 'desc' };

    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.APPROVED,
        ...(category && { category: { slug: category } }),
        ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
        ...(sellerRegion && { seller: { region: sellerRegion } }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy,
      include: {
        images: true,
        category: true,
        seller: { select: { shopName: true, shopSlug: true, region: true } },
        reviews: { select: { rating: true } },
      },
    });
  }

  // ─── Public: get single product by slug ──────────────────────────────────────
  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        category: true,
        seller: {
          select: { shopName: true, shopSlug: true, region: true, bio: true, isVerified: true },
        },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ─── Seller: list own products ────────────────────────────────────────────────
  async getSellerProducts(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Seller: create product ───────────────────────────────────────────────────
  async create(
    sellerId: string,
    data: {
      categoryId: string;
      title: string;
      slug: string;
      description: string;
      price: number;
      stock: number;
      tags?: string;
      images: string[];
    },
  ) {
    const { images, ...rest } = data;
    return this.prisma.product.create({
      data: {
        ...rest,
        sellerId,
        images: {
          create: images.map((url, i) => ({ url, isPrimary: i === 0 })),
        },
      },
      include: { images: true },
    });
  }

  // ─── Seller: update own product ───────────────────────────────────────────────
  async update(
    productId: string,
    sellerId: string,
    data: {
      categoryId?: string;
      title?: string;
      slug?: string;
      description?: string;
      price?: number;
      stock?: number;
      tags?: string;
      images?: string[];
    },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    const { images, ...rest } = data;

    // If new images are provided, replace old ones
    if (images && images.length > 0) {
      await this.prisma.productImage.deleteMany({ where: { productId } });
      await this.prisma.productImage.createMany({
        data: images.map((url, i) => ({ productId, url, isPrimary: i === 0 })),
      });
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: rest,
      include: { images: true },
    });
  }

  // ─── Seller: delete own product ───────────────────────────────────────────────
  async remove(productId: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted' };
  }

  // ─── Admin: list products pending review ──────────────────────────────────────
  async getPendingProducts() {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.PENDING },
      include: {
        images: true,
        category: true,
        seller: { select: { shopName: true, region: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Admin: approve or reject a product ──────────────────────────────────────
  async reviewProduct(productId: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id: productId },
      data: { status },
    });
  }
}
