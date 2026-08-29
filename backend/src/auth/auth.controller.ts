import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './get-user.decorator';
import { OAuth2Client } from 'google-auth-library';

import { Throttle } from '@nestjs/throttler';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Send OTP ──────────────────────────────────────────────────────────────
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required.');
    return this.authService.sendOtp(email);
  }

  // ─── Register (with OTP) ────────────────────────────────────────────────────
  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') password: string,
    @Body('otpCode') otpCode?: string,
  ) {
    return this.authService.register(email, name, password, otpCode);
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') passwordHash: string,
  ) {
    return this.authService.login(email, passwordHash);
  }

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('idToken') token: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token payload');
      }
      return this.authService.validateGoogleUser(payload.email, payload.name || '');
    } catch (error) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required.');
    return this.authService.forgotPassword(email);
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!token || !email || !password) {
      throw new BadRequestException('Token, email, and new password are required.');
    }
    return this.authService.resetPassword(token, email, password);
  }

  // ─── Me ──────────────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return { success: true, user };
  }
}
