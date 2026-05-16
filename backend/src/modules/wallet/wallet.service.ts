// src/modules/wallet/wallet.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, WalletTransactionType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { TransactionQueryDto } from './dto/transaction-query.dto';

import {
  WalletResponse,
  WalletTransactionResponse,
  PaginatedWalletTransactionResponse,
} from './interfaces/wallet.interface';

// ==================== REUSABLE SELECT ====================

const walletTransactionInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.WalletTransactionInclude;

type WalletTransactionPayload = Prisma.WalletTransactionGetPayload<{
  include: typeof walletTransactionInclude;
}>;

// ==================== SERVICE ====================

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mapping wallet transaction
   */
  private mapToWalletTransactionResponse(
    tx: WalletTransactionPayload,
  ): WalletTransactionResponse {
    return {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      referenceId: tx.referenceId,
      createdAt: tx.createdAt,

      booking: tx.referenceId
        ? {
            id: Number(tx.referenceId),
            status: 'UNKNOWN',
          }
        : null,
    };
  }

  /**
   * Lấy số dư ví
   */
  async getMyWallet(userId: number): Promise<WalletResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        creditBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      creditBalance: user.creditBalance,
    };
  }

  /**
   * Lịch sử giao dịch
   */
  async getMyTransactions(
    userId: number,
    query: TransactionQueryDto,
  ): Promise<PaginatedWalletTransactionResponse> {
    const { page = 1, limit = 10, type } = query;

    const safeLimit = Math.min(limit, 50);

    const skip = (page - 1) * safeLimit;

    const where: Prisma.WalletTransactionWhereInput = {
      userId,

      ...(type && {
        type,
      }),
    };

    const [total, transactions] = await Promise.all([
      this.prisma.walletTransaction.count({
        where,
      }),

      this.prisma.walletTransaction.findMany({
        where,

        include: walletTransactionInclude,

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: safeLimit,
      }),
    ]);

    return {
      items: transactions.map((tx) => this.mapToWalletTransactionResponse(tx)),

      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
