import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@GetUser('id') userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  @Get('addresses')
  async getAddresses(@GetUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('addresses')
  async addAddress(
    @GetUser('id') userId: string,
    @Body() body: {
      name: string;
      phone: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
    },
  ) {
    return this.usersService.addAddress(userId, body);
  }

  @Put('addresses/:id')
  async updateAddress(
    @GetUser('id') userId: string,
    @Param('id') addressId: string,
    @Body() body: {
      name?: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      isDefault?: boolean;
    },
  ) {
    return this.usersService.updateAddress(userId, addressId, body);
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @GetUser('id') userId: string,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(userId, addressId);
  }
}
