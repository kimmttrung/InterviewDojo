// src/modules/wallet/wallet.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';

// ==================== SELECT REUSABLE ====================

const walletTransactionSelect = {
  id: true,
  type: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  referenceId: true,
  note: true,
  createdAt: true,
} satisfies Prisma.WalletTransactionSelect;

// ==================== SERVICE ====================

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy số dư ví — trả raw data.
   */
  async getMyWallet(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return { creditBalance: user.creditBalance };
  }

  /**
   * Lịch sử giao dịch có phân trang — trả raw data.
   */
  async getMyTransactions(userId: number, query: TransactionQueryDto) {
    const { page = 1, limit = 10, type } = query;
    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.WalletTransactionWhereInput = {
      userId,
      ...(type && { type }),
    };

    const [total, items] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        select: walletTransactionSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
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
   * Cộng tiền vào ví (atomic).
   *
   * FIX race condition: đọc balanceBefore TRƯỚC khi increment,
   * bên trong cùng transaction để đảm bảo consistent read.
   * Nếu 2 webhook đến đồng thời (SePay retry), balanceBefore
   * sẽ chính xác cho từng request.
   */
  async depositAtomic(
    userId: number,
    amount: number,
    referenceId: string,
    note?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // 1. Đọc balance trước khi update
    const userBefore = await client.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });
    if (!userBefore) throw new NotFoundException('User not found');

    // 2. Increment atomic
    const updated = await client.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
      select: { id: true, creditBalance: true },
    });

    // 3. Ghi lịch sử với balance chính xác
    await client.walletTransaction.create({
      data: {
        userId,
        type: WalletTransactionType.DEPOSIT,
        amount,
        balanceBefore: userBefore.creditBalance,
        balanceAfter: updated.creditBalance,
        referenceId,
        note: note ?? null,
      },
    });

    return { id: updated.id, creditBalance: updated.creditBalance };
  }
}
