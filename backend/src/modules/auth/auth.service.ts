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

// ─── Type cho kết quả checkBanStatus ────────────────────────────────────────
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

// ─── Shape truyền vào checkBanStatus ────────────────────────────────────────
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
        throw new BadRequestException('Email đã tồn tại');
      }

      if (dto.role === Role.ADMIN) {
        throw new BadRequestException('Không được phép đăng ký ADMIN');
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
  // LOGIN — 1 DB query, check ban từ data đã có, không query lại
  // ══════════════════════════════════════════════════════════════════
  async login(dto: LoginDto) {
    // 1 query duy nhất, lấy đủ fields cần thiết
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
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    // checkBanStatus nhận thẳng object user — không query DB lần 2
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
  // REFRESH — try/catch chỉ bao quanh verifyAsync, KHÔNG nuốt ForbiddenException
  // ══════════════════════════════════════════════════════════════════
  async refresh(dto: RefreshTokenDto) {
    // Chỉ wrap phần verify — để ForbiddenException bên dưới propagate đúng
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET as string,
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    // Phần này NGOÀI try/catch → ForbiddenException sẽ propagate lên đúng
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
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const banCheck = await this.checkBanStatus(user);
    if (!banCheck.allowed) {
      // Throw ForbiddenException NGOÀI try/catch → không bị nuốt
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
      throw new BadRequestException('Email đã tồn tại');
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

  // validateUser đã bị XÓA — JwtStrategy stateless, không cần nữa

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

  //đang để lazy nên để stateless, tin tưởng hoàn toàn payload, nếu phát sinh bug thì vào cần check luc login

  // async validateUser(userId: number) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     select: { id: true, email: true, name: true, role: true },
  //   });
  //   if (!user) {
  //     throw new UnauthorizedException('Người dùng không tồn tại');
  //   }
  //   return { sub: user.id, ...user };
  // }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — checkBanStatus
  // Nhận object user đã có sẵn, KHÔNG query DB lần 2.
  // Chỉ query DB khi cần auto-unban (update).
  // ══════════════════════════════════════════════════════════════════
  private async checkBanStatus(user: BanCheckInput): Promise<BanCheckResult> {
    // Không bị ban → cho qua ngay
    if (user.status !== UserStatus.BANNED) {
      return { allowed: true };
    }

    // Ban vĩnh viễn (bannedUntil = null)
    if (!user.bannedUntil) {
      return {
        allowed: false,
        code: 'PERMANENT_BAN',
        message:
          'Tài khoản của bạn đã bị khóa vĩnh viễn. Vui lòng liên hệ hỗ trợ.',
        banReason: user.banReason,
      };
    }

    const now = new Date();

    // Ban tạm thời đã hết hạn → tự động unban (idempotent với updateMany)
    if (user.bannedUntil <= now) {
      await this.prisma.user.updateMany({
        where: { id: user.id, status: UserStatus.BANNED }, // chỉ update nếu vẫn BANNED
        data: { status: UserStatus.ACTIVE, banReason: null, bannedUntil: null },
      });
      return { allowed: true };
    }

    // Ban tạm thời còn hiệu lực → tính thời gian còn lại
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
      message: `Tài khoản bị khóa tạm thời. Còn ${remainingDays} ngày ${remainingHours} giờ (đến ${bannedUntilLocal}).`,
      banReason: user.banReason,
      bannedUntilLocal,
      remainingDays,
      remainingHours,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — buildBanPayload
  // Tạo payload flat cho ForbiddenException.
  // AllExceptionsFilter sẽ flatten object này vào field `data`.
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
