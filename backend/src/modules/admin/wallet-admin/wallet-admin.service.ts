// src/modules/admin/wallet-admin/wallet-admin.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminTransactionQueryDto } from './dto/admin-transaction-query.dto';

@Injectable()
export class WalletAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách tất cả giao dịch toàn hệ thống cho admin.
   * Hỗ trợ filter: type, search (email/name/referenceId), startDate, endDate.
   */
  async getAllTransactions(dto: AdminTransactionQueryDto) {
    const { page = 1, limit = 15, search, type, startDate, endDate } = dto;
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.WalletTransactionWhereInput = {};

    if (type) {
      where.type = type;
    }

    // Filter theo khoảng ngày
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search: email, name (user) hoặc referenceId (transaction)
    // Dùng OR ở level WalletTransaction, không nest vào user
    if (search) {
      where.OR = [
        { referenceId: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Thống kê ví toàn hệ thống cho admin dashboard.
   */
  async getWalletStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalDeposit,
      totalDepositThisMonth,
      totalDepositLastMonth,
      totalPayout,
      totalPlatformFee,
      totalPlatformFeeThisMonth,
      topUsers,
      recentAdjustments,
    ] = await Promise.all([
      // Tổng nạp tiền all time
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.DEPOSIT },
        _sum: { amount: true },
      }),

      // Nạp tháng này
      this.prisma.walletTransaction.aggregate({
        where: {
          type: WalletTransactionType.DEPOSIT,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Nạp tháng trước (để tính delta)
      this.prisma.walletTransaction.aggregate({
        where: {
          type: WalletTransactionType.DEPOSIT,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),

      // Tổng đã trả cho mentor
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.PAYOUT },
        _sum: { amount: true },
      }),

      // Tổng phí nền tảng all time
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.PLATFORM_FEE },
        _sum: { amount: true },
      }),

      // Phí nền tảng tháng này
      this.prisma.walletTransaction.aggregate({
        where: {
          type: WalletTransactionType.PLATFORM_FEE,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Top 5 user có số dư cao nhất
      this.prisma.user.findMany({
        orderBy: { creditBalance: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          creditBalance: true,
        },
      }),

      // 5 lần admin adjustment gần nhất
      this.prisma.walletTransaction.findMany({
        where: { type: WalletTransactionType.ADMIN_ADJUSTMENT },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    // Tổng credit đang lưu hành trong hệ thống
    const totalCreditInSystem = await this.prisma.user.aggregate({
      _sum: { creditBalance: true },
    });

    const depositThisMonth = totalDepositThisMonth._sum.amount ?? 0;
    const depositLastMonth = totalDepositLastMonth._sum.amount ?? 0;
    const depositDelta =
      depositLastMonth === 0
        ? depositThisMonth > 0
          ? 100
          : 0
        : Math.round(
            ((depositThisMonth - depositLastMonth) / depositLastMonth) * 1000,
          ) / 10;

    return {
      totalDeposit: totalDeposit._sum.amount ?? 0,
      totalDepositThisMonth: depositThisMonth,
      depositDelta, // % so với tháng trước
      totalPayout: totalPayout._sum.amount ?? 0,
      totalPlatformFee: totalPlatformFee._sum.amount ?? 0,
      totalPlatformFeeThisMonth: totalPlatformFeeThisMonth._sum.amount ?? 0,
      totalCreditInSystem: totalCreditInSystem._sum.creditBalance ?? 0,
      topUsers,
      recentAdjustments,
    };
  }

  /**
   * Admin điều chỉnh số dư thủ công.
   * Dùng ADMIN_ADJUSTMENT type để tách biệt khỏi DEPOSIT/PAYMENT.
   * referenceId có format ADMIN_ADJ_{adminId}_{timestamp} để truy xuất được.
   */
  async adminAdjustBalance(
    userId: number,
    amount: number,
    note: string,
    adminId: number,
  ) {
    if (amount === 0) throw new BadRequestException('Amount must not be zero');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, creditBalance: true, name: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Kiểm tra không để balance âm khi trừ
    if (amount < 0 && user.creditBalance + amount < 0) {
      throw new BadRequestException(
        `Số dư không đủ. Hiện tại: ${user.creditBalance}, yêu cầu trừ: ${Math.abs(amount)}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const userBefore = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: amount } },
        select: { creditBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.ADMIN_ADJUSTMENT,
          amount: Math.abs(amount),
          balanceBefore: userBefore!.creditBalance,
          balanceAfter: updated.creditBalance,
          referenceId: `ADMIN_ADJ_${adminId}_${Date.now()}`,
          note, // note đã bao gồm adminId từ controller
        },
      });

      return {
        userId,
        userName: user.name,
        oldBalance: userBefore!.creditBalance,
        newBalance: updated.creditBalance,
        adjustment: amount,
      };
    });

    return result;
  }
}
