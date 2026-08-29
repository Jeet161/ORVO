import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { SellersService } from '../sellers/sellers.service';
import { Role, ProductStatus } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private sellersService: SellersService,
  ) {}

  @Get()
  async getPublicProducts(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sellerRegion') sellerRegion?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'newest',
    @Query('isStudentListing') isStudentListing?: string,
    @Query('condition') condition?: string,
    @Query('listingType') listingType?: string,
    @Query('location') location?: string,
  ) {
    return this.productsService.getPublicProducts({
      category,
      minPrice,
      maxPrice,
      sellerRegion,
      search,
      sortBy,
      isStudentListing: isStudentListing === 'true',
      condition,
      listingType,
      location,
    });
  }

  @Get('detail/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @Get('seller/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.BUYER)
  async getSellerProducts(@GetUser('id') userId: string) {
    const seller = await this.sellersService.getSellerProfile(userId);
    return this.productsService.getSellerProducts(seller.id);
  }

  @Post('seller/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.BUYER)
  async createProduct(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Body() body: any,
  ) {
    const seller = await this.sellersService.getSellerProfile(userId);
    if (role === Role.BUYER) {
      body.isStudentListing = true;
    }
    return this.productsService.create(seller.id, body);
  }

  @Put('seller/me/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.BUYER)
  async updateProduct(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Param('id') productId: string,
    @Body() body: any,
  ) {
    const seller = await this.sellersService.getSellerProfile(userId);
    if (role === Role.BUYER) {
      body.isStudentListing = true;
    }
    return this.productsService.update(productId, seller.id, body);
  }

  @Delete('seller/me/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.BUYER)
  async deleteProduct(
    @GetUser('id') userId: string,
    @Param('id') productId: string,
  ) {
    const seller = await this.sellersService.getSellerProfile(userId);
    return this.productsService.remove(productId, seller.id);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPendingProducts() {
    return this.productsService.getPendingProducts();
  }

  @Put('admin/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reviewProduct(
    @Param('id') productId: string,
    @Body('status') status: ProductStatus,
  ) {
    return this.productsService.reviewProduct(productId, status);
  }
}
