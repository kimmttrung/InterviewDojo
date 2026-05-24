import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetUsersAdminDto } from './dto/get-users-admin.dto';
import { BanUserDto, BanDurationType } from './dto/ban-user.dto';
import { buildPaginationResponse } from '../../../common/interfaces/pagination.interface';
import { Role, UserStatus } from '@prisma/client';
import {
  formatLocalDateTime,
  DEFAULT_TIMEZONE,
} from '../../../common/utils/timezone';

@Injectable()
export class UserAdminService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Danh sách tất cả users (có filter + search + phân trang)
  // ──────────────────────────────────────────
  async findAll(dto: GetUsersAdminDto) {
    const { page, limit, role, status, search } = dto;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          status: true,
          banReason: true,
          bannedUntil: true,
          createdAt: true,
          experienceYears: true,
          mentorProfile: { select: { approvalStatus: true } },
          _count: { select: { reportsReceived: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginationResponse(users, total, page, limit);
  }

  // ──────────────────────────────────────────
  // Danh sách users bị báo cáo — group bằng JS để lấy latestReason đúng
  // ──────────────────────────────────────────
  async getReportedUsers() {
    // Lấy tất cả reports targetType=USER, sort mới nhất trước
    const reports = await this.prisma.userReport.findMany({
      where: {
        targetType: 'USER',
        targetUserId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        targetUserId: true,
        reason: true,
        type: true,
        status: true,
        createdAt: true,
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Group: count + giữ latest reason (đã sort desc rồi nên phần tử đầu = mới nhất)
    const userMap = new Map<
      number,
      {
        reportCount: number;
        latestReason: string;
        latestReportAt: Date;
        reportTypes: string[];
      }
    >();

    for (const r of reports) {
      const uid = r.targetUserId!;
      const existing = userMap.get(uid);
      if (!existing) {
        userMap.set(uid, {
          reportCount: 1,
          latestReason: r.reason,
          latestReportAt: r.createdAt,
          reportTypes: [r.type],
        });
      } else {
        existing.reportCount += 1;
        // Đã sort desc → phần tử đầu tiên trong map là mới nhất, không cần compare thêm
        if (!existing.reportTypes.includes(r.type)) {
          existing.reportTypes.push(r.type);
        }
      }
    }

    const userIds = Array.from(userMap.keys());
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        status: true,
        role: true,
        banReason: true,
        bannedUntil: true,
      },
    });

    // Sort theo reportCount giảm dần
    return userIds
      .map((uid) => {
        const user = users.find((u) => u.id === uid);
        const data = userMap.get(uid)!;
        return { user, ...data };
      })
      .filter((item) => item.user)
      .sort((a, b) => b.reportCount - a.reportCount);
  }

  // ──────────────────────────────────────────
  // Ban user
  // ──────────────────────────────────────────
  async banUser(userId: number, dto: BanUserDto, adminId: number) {
    // Không tự ban chính mình
    if (userId === adminId) {
      throw new BadRequestException(
        'Không thể tự khóa tài khoản của chính mình',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // Không ban admin khác
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Không thể khóa tài khoản admin');
    }

    // Check ban còn hiệu lực (không tính ban đã expired)
    const isActiveBan =
      user.status === UserStatus.BANNED &&
      (!user.bannedUntil || user.bannedUntil > new Date());
    if (isActiveBan) {
      throw new BadRequestException('User đang bị khóa');
    }

    // Validate temporary ban phải có days
    if (
      dto.duration === BanDurationType.TEMPORARY &&
      (!dto.days || dto.days < 1)
    ) {
      throw new BadRequestException('Ban tạm thời phải có số ngày hợp lệ');
    }

    // Tính bannedUntil — lưu UTC vào DB (chuẩn)
    const bannedUntil =
      dto.duration === BanDurationType.TEMPORARY && dto.days
        ? new Date(Date.now() + dto.days * 24 * 60 * 60 * 1000)
        : null; // null = vĩnh viễn

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.BANNED, banReason: dto.reason, bannedUntil },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetUserId: userId,
          action:
            dto.duration === BanDurationType.TEMPORARY
              ? 'TEMP_BAN'
              : 'PERMANENT_BAN',
          reason: dto.reason,
          bannedUntil,
        },
      }),
    ]);
  }

  // ──────────────────────────────────────────
  // Unban user (bởi admin)
  // ──────────────────────────────────────────
  async unbanUser(userId: number, adminId: number) {
    if (userId === adminId) {
      throw new BadRequestException(
        'Không thể tự mở khóa tài khoản của chính mình',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    if (user.status !== UserStatus.BANNED) {
      throw new BadRequestException('User không trong trạng thái bị khóa');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE, banReason: null, bannedUntil: null },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'UNBAN',
          reason: 'Mở khóa tài khoản bởi admin',
        },
      }),
    ]);
  }

  async findOne(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        creditBalance: true,
        createdAt: true,
        experienceYears: true,
        linkedInLink: true,
        githubLink: true,
        targetRoleId: true,
        banReason: true,
        bannedUntil: true,
      },
    });
    if (!user) throw new NotFoundException('User không tồn tại');
    return user;
  }
}
