import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WalletTransactionType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('WalletService', () => {
  let service: WalletService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    walletTransaction: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(WalletService);
    jest.clearAllMocks();
  });

  it('getMyWallet - happy path', async () => {
    prisma.user.findUnique.mockResolvedValue({
      creditBalance: 150000,
    });

    const result = await service.getMyWallet(1);

    expect(result).toEqual({ creditBalance: 150000 });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { creditBalance: true },
    });
  });

  it('getMyWallet - user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getMyWallet(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getMyTransactions - happy path default query without referenceId', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.walletTransaction.count.mockResolvedValue(1);
    prisma.walletTransaction.findMany.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        type: WalletTransactionType.DEPOSIT,
        amount: 100,
        balanceBefore: 0,
        balanceAfter: 100,
        referenceId: null,
        createdAt,
      },
    ]);

    const result = await service.getMyTransactions(1, {});

    expect(result.items).toHaveLength(1);
    // Không còn kiểm tra booking
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(prisma.walletTransaction.count).toHaveBeenCalledWith({
      where: { userId: 1 },
    });
    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('getMyTransactions - with type, pagination and referenceId', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.walletTransaction.count.mockResolvedValue(1);
    prisma.walletTransaction.findMany.mockResolvedValue([
      {
        id: 2,
        userId: 1,
        type: WalletTransactionType.PAYMENT,
        amount: 50,
        balanceBefore: 100,
        balanceAfter: 50,
        referenceId: '99',
        createdAt,
      },
    ]);

    const result = await service.getMyTransactions(1, {
      page: 2,
      limit: 5,
      type: WalletTransactionType.PAYMENT,
    });

    // Thay vì booking, kiểm tra referenceId
    expect(result.items[0].referenceId).toBe('99');

    expect(result.meta).toEqual({
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });

    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 1,
          type: WalletTransactionType.PAYMENT,
        },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('getMyTransactions - limit greater than 50 should use safeLimit 50', async () => {
    prisma.walletTransaction.count.mockResolvedValue(0);
    prisma.walletTransaction.findMany.mockResolvedValue([]);

    const result = await service.getMyTransactions(1, {
      page: 1,
      limit: 999,
    } as any);

    expect(result.meta.limit).toBe(50);
    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 50,
      }),
    );
  });
});
