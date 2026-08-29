import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // ─── Send OTP ─────────────────────────────────────────────────────────────────
  async sendOtp(email: string) {
    // 1. Check if email is already registered and verified
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isEmailVerified) {
      throw new ConflictException('This email is already registered.');
    }

    // 2. Rate limiting: 60s cooldown between OTP sends
    const lastToken = await this.prisma.verificationToken.findFirst({
      where: { identifier: email },
      orderBy: { expires: 'desc' },
    });

    if (lastToken) {
      const cooldownEnd = new Date(lastToken.expires.getTime() - 10 * 60 * 1000 + 60 * 1000);
      if (new Date() < cooldownEnd) {
        throw new BadRequestException('Please wait 60 seconds before requesting a new code.');
      }
    }

    // 3. Generate a cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Store OTP (delete old ones first, then insert new)
    await this.prisma.$transaction([
      this.prisma.verificationToken.deleteMany({ where: { identifier: email } }),
      this.prisma.verificationToken.create({
        data: { identifier: email, token: otp, expires },
      }),
    ]);

    // 5. Send branded ORVO email
    const result = await this.emailService.sendEmail({
      to: email,
      subject: `Your ORVO Verification Code: ${otp}`,
      html: this.emailService.getOtpTemplate(otp),
    });

    if (!result.success) {
      throw new InternalServerErrorException('Failed to send verification email. Please try again.');
    }

    return {
      message: 'Verification code sent to your email.',
      email,
      expiresAt: expires.toISOString(),
      cooldown: 60,
    };
  }

  // ─── Register (with OTP verification) ────────────────────────────────────────
  async register(email: string, name: string, passwordHash: string, otpCode?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(passwordHash, 12);

    // Verify OTP if provided
    let isEmailVerified = false;
    if (otpCode) {
      const verificationToken = await this.prisma.verificationToken.findUnique({
        where: { token: otpCode },
      });

      if (!verificationToken || verificationToken.identifier !== email) {
        throw new BadRequestException('Invalid verification code.');
      }

      if (verificationToken.expires < new Date()) {
        await this.prisma.verificationToken.delete({ where: { token: otpCode } }).catch(() => {});
        throw new BadRequestException('Verification code has expired. Please request a new one.');
      }

      isEmailVerified = true;
      await this.prisma.verificationToken.delete({ where: { token: otpCode } });
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: Role.BUYER,
        isEmailVerified,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(email: string, passwordHash: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ─── Validate by ID ──────────────────────────────────────────────────────────
  async validateUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────
  async validateGoogleUser(email: string, name: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          role: 'BUYER',
          isEmailVerified: true,
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Don't reveal if user exists (prevents email harvesting)
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const identifier = `reset-password:${email}`;

    await this.prisma.$transaction([
      this.prisma.verificationToken.deleteMany({ where: { identifier } }),
      this.prisma.verificationToken.create({
        data: { identifier, token, expires },
      }),
    ]);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await this.emailService.sendEmail({
      to: email,
      subject: 'Reset Your ORVO Password',
      html: this.emailService.getResetPasswordTemplate(resetLink),
    });

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────
  async resetPassword(token: string, email: string, newPassword: string) {
    const identifier = `reset-password:${email}`;

    const storedToken = await this.prisma.verificationToken.findFirst({
      where: { identifier, token },
    });

    if (!storedToken) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    if (storedToken.expires < new Date()) {
      await this.prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      throw new BadRequestException('Reset link has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.verificationToken.delete({ where: { token } }),
    ]);

    return { message: 'Password has been reset successfully.' };
  }
}
