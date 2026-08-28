import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('pending-sellers')
  async getPendingSellers() {
    return this.adminService.getPendingSellers();
  }

  @Get('pending-products')
  async getPendingProducts() {
    return this.adminService.getPendingProducts();
  }

  @Get('orders')
  async getAllOrders() {
    return this.adminService.getAllOrders();
  }
}
