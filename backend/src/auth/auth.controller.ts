import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './get-user.decorator';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') passwordHash: string,
  ) {
    return this.authService.register(email, name, passwordHash);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') passwordHash: string,
  ) {
    return this.authService.login(email, passwordHash);
  }

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return { success: true, user };
  }
}
