import { Controller, Post, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { Role, SellerStatus } from '@prisma/client';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post('apply')
  async applyAsSeller(
    @GetUser('id') userId: string,
    @Body() body: {
      shopName: string;
      shopSlug: string;
      region: string;
      bio?: string;
      businessLicenseUrl: string;
      idProofUrl: string;
    },
  ) {
    return this.sellersService.applyAsSeller(userId, body);
  }

  @Post('student-onboard')
  async studentOnboard(@GetUser('id') userId: string) {
    return this.sellersService.studentOnboard(userId);
  }

  @Get('profile/me')
  async getProfile(@GetUser('id') userId: string) {
    return this.sellersService.getSellerProfile(userId);
  }

  @Get('analytics/me')
  @Roles(Role.SELLER, Role.BUYER)
  async getAnalytics(@GetUser('id') userId: string) {
    const profile = await this.sellersService.getSellerProfile(userId);
    return this.sellersService.getSellerAnalytics(profile.id);
  }

  @Get('admin/applications')
  @Roles(Role.ADMIN)
  async getPendingApplications() {
    return this.sellersService.listPendingApplications();
  }

  @Put('admin/applications/:id/review')
  @Roles(Role.ADMIN)
  async reviewApplication(
    @Param('id') applicationId: string,
    @Body('status') status: SellerStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.sellersService.reviewApplication(applicationId, status, rejectionReason);
  }
}
