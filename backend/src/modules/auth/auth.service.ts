// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus, Role } from '@prisma/client';
import {
  formatLocalDateTime,
  DEFAULT_TIMEZONE,
} from '../../common/utils/timezone';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// ─── Ban check result types ───────────────────────────────────────────
type BanAllowed = { allowed: true };
type BanDenied = {
  allowed: false;
  code: 'PERMANENT_BAN' | 'TEMPORARY_BAN';
  message: string;
  banReason: string | null;
  bannedUntilLocal?: string;
  remainingDays?: number;
  remainingHours?: number;
};
type BanCheckResult = BanAllowed | BanDenied;

// ─── Ban check input shape ────────────────────────────────────────────
interface BanCheckInput {
  id: number;
  status: UserStatus;
  bannedUntil: Date | null;
  banReason: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════════════════════════════
  async register(dto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      if (dto.role === Role.ADMIN) {
        throw new BadRequestException(
          'Registration for ADMIN role is not allowed',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const role = dto.role ?? Role.CANDIDATE;

      const newUser = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role,
          },
        });

        if (role === Role.MENTOR) {
          await tx.mentorProfile.create({
            data: {
              userId: createdUser.id,
              headline: '',
            },
          });
        }

        return createdUser;
      });

      return this.generateTokens(newUser.id, newUser.email, newUser.role);
    } catch (error) {
      console.error('REGISTER ERROR:', error);
      throw error;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // LOGIN — 1 DB query, check ban from retrieved data, no re-querying
  // ══════════════════════════════════════════════════════════════════
  async login(dto: LoginDto) {
    // Single query to retrieve all necessary fields
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
        bannedUntil: true,
        banReason: true,
        mentorProfile: { select: { id: true } },
        targetRoleId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // checkBanStatus consumes the user object directly — no second DB query
    const banCheck = await this.checkBanStatus(user);
    if (!banCheck.allowed) {
      throw new ForbiddenException(this.buildBanPayload(banCheck));
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    let redirect: string | null = null;
    if (user.role === Role.MENTOR && !user.mentorProfile) {
      redirect = '/mentor/setup';
    } else if (user.role === Role.CANDIDATE && !user.targetRoleId) {
      redirect = '/candidate/setup';
    }

    return { ...tokens, redirect };
  }

  // ══════════════════════════════════════════════════════════════════
  // REFRESH — try/catch wraps verifyAsync only, does NOT swallow ForbiddenException
  // ══════════════════════════════════════════════════════════════════
  async refresh(dto: RefreshTokenDto) {
    // Wrap token verification only — allows subsequent ForbiddenException to propagate correctly
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET as string,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Outside the try/catch block → ForbiddenException propagates seamlessly
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        bannedUntil: true,
        banReason: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const banCheck = await this.checkBanStatus(user);
    if (!banCheck.allowed) {
      // Thrown outside try/catch -> will not be swallowed
      throw new ForbiddenException(this.buildBanPayload(banCheck));
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ══════════════════════════════════════════════════════════════════
  // CREATE ADMIN
  // ══════════════════════════════════════════════════════════════════
  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: Role.ADMIN,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — generateTokens
  // ══════════════════════════════════════════════════════════════════
  private async generateTokens(userId: number, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — checkBanStatus
  // Accepts already fetched user object, NO secondary DB queries.
  // Performs DB mutation ONLY on explicit lazy auto-unban condition.
  // ══════════════════════════════════════════════════════════════════
  private async checkBanStatus(user: BanCheckInput): Promise<BanCheckResult> {
    // If user is not banned, skip immediately
    if (user.status !== UserStatus.BANNED) {
      return { allowed: true };
    }

    // Permanent ban handling (bannedUntil = null)
    if (!user.bannedUntil) {
      return {
        allowed: false,
        code: 'PERMANENT_BAN',
        message:
          'Your account has been permanently suspended. Please contact support.',
        banReason: user.banReason,
      };
    }

    const now = new Date();

    // Expired temporary ban -> execution of lazy automatic unban
    if (user.bannedUntil <= now) {
      await this.prisma.user.updateMany({
        where: { id: user.id, status: UserStatus.BANNED }, // ensure idempotent status shift
        data: { status: UserStatus.ACTIVE, banReason: null, bannedUntil: null },
      });
      return { allowed: true };
    }

    // Active temporary ban -> evaluate remaining penalty scope
    const diffMs = user.bannedUntil.getTime() - now.getTime();
    const remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const bannedUntilLocal = formatLocalDateTime(
      user.bannedUntil,
      DEFAULT_TIMEZONE,
    );

    return {
      allowed: false,
      code: 'TEMPORARY_BAN',
      message: `Your account is temporarily suspended. Remaining time: ${remainingDays} day(s) ${remainingHours} hour(s) (until ${bannedUntilLocal}).`,
      banReason: user.banReason,
      bannedUntilLocal,
      remainingDays,
      remainingHours,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — buildBanPayload
  // Configures flattened error structure bound for AllExceptionsFilter handling.
  // ══════════════════════════════════════════════════════════════════
  private buildBanPayload(ban: BanDenied) {
    return {
      error: 'ACCOUNT_BANNED',
      code: ban.code,
      message: ban.message,
      banReason: ban.banReason ?? null,
      bannedUntilLocal: ban.bannedUntilLocal ?? null,
      remainingDays: ban.remainingDays ?? null,
      remainingHours: ban.remainingHours ?? null,
    };
  }
}
