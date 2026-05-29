import {
  BookingStatus,
  MentorPayoutStatus,
  SessionMode,
  SessionSource,
  SessionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { MentorPayoutService } from './mentor-payout.service';

describe('MentorPayoutService', () => {
  let service: MentorPayoutService;
  let prisma: any;

  const payout = {
    id: 7,
    sessionId: 11,
    bookingId: 22,
    mentorId: 2,
    candidateId: 1,
    grossAmount: 100000,
    platformFeePercent: 10,
    platformFeeAmount: 10000,
    mentorEarning: 90000,
    refundableAmount: 100000,
    status: MentorPayoutStatus.PENDING,
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      mockSession: { findUnique: jest.fn() },
      booking: { update: jest.fn() },
      mentorPayout: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      walletTransaction: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new MentorPayoutService(prisma, {
      get: jest.fn().mockReturnValue('10'),
    } as unknown as ConfigService);
  });

  it('pays out a completed mentor booking session automatically', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      status: SessionStatus.COMPLETED,
      source: SessionSource.MENTOR_BOOKING,
      mode: SessionMode.MEET,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        status: BookingStatus.ACCEPTED,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.walletTransaction.findFirst.mockResolvedValue(null);
    prisma.mentorPayout.create.mockResolvedValue(payout);
    prisma.mentorPayout.update.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });
    prisma.user.findUnique.mockResolvedValue({ creditBalance: 50000 });
    prisma.user.update.mockResolvedValue({ creditBalance: 140000 });

    await expect(service.payoutCompletedSession(11)).resolves.toEqual({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    expect(prisma.mentorPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 11,
        bookingId: 22,
        mentorId: 2,
        candidateId: 1,
        grossAmount: 100000,
        platformFeePercent: 10,
        platformFeeAmount: 10000,
        mentorEarning: 90000,
        refundableAmount: 100000,
        status: MentorPayoutStatus.PENDING,
      }),
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { creditBalance: { increment: 90000 } },
      select: { creditBalance: true },
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 2,
        type: WalletTransactionType.PAYOUT,
        amount: 90000,
        referenceId: 'session:11',
      }),
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        type: WalletTransactionType.PLATFORM_FEE,
        amount: 10000,
        referenceId: 'session:11',
      }),
    });
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 22 },
      data: { status: BookingStatus.COMPLETED },
    });
  });

  it('returns the existing payout instead of creating a duplicate', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      status: SessionStatus.COMPLETED,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: payout,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        status: BookingStatus.ACCEPTED,
        snapshotPlanPrice: 100000,
      },
    });

    prisma.walletTransaction.findFirst.mockResolvedValue({
      id: 100,
      type: WalletTransactionType.PAYOUT,
      referenceId: 'session:11',
    });
    prisma.mentorPayout.update.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    await expect(service.payoutCompletedSession(11)).resolves.toEqual({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    expect(prisma.mentorPayout.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('approves a payout atomically and records payout plus platform fee transactions', async () => {
    prisma.mentorPayout.updateMany.mockResolvedValue({ count: 1 });
    prisma.mentorPayout.findUniqueOrThrow
      .mockResolvedValueOnce(payout)
      .mockResolvedValueOnce({
        ...payout,
        status: MentorPayoutStatus.COMPLETED,
      });
    prisma.user.findUnique.mockResolvedValue({ creditBalance: 50000 });
    prisma.user.update.mockResolvedValue({ creditBalance: 140000 });

    await expect(service.approvePayout(7, 99)).resolves.toEqual({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    expect(prisma.mentorPayout.updateMany).toHaveBeenCalledWith({
      where: { id: 7, status: MentorPayoutStatus.PENDING },
      data: expect.objectContaining({
        status: MentorPayoutStatus.COMPLETED,
        reviewedByAdminId: 99,
      }),
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { creditBalance: { increment: 90000 } },
      select: { creditBalance: true },
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 2,
        type: WalletTransactionType.PAYOUT,
        amount: 90000,
        referenceId: 'session:11',
      }),
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        type: WalletTransactionType.PLATFORM_FEE,
        amount: 10000,
        referenceId: 'session:11',
      }),
    });
  });

  it('rejects a payout and refunds the candidate', async () => {
    prisma.mentorPayout.findUnique.mockResolvedValue(payout);
    prisma.mentorPayout.update.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.REJECTED,
      rejectReason: 'Dispute accepted',
    });
    prisma.mentorPayout.findUniqueOrThrow.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.REJECTED,
      rejectReason: 'Dispute accepted',
    });
    prisma.user.findUnique.mockResolvedValue({ creditBalance: 10000 });
    prisma.user.update.mockResolvedValue({ creditBalance: 110000 });

    await service.rejectPayout(7, 99, 'Dispute accepted');

    expect(prisma.mentorPayout.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        status: MentorPayoutStatus.REJECTED,
        reviewedByAdminId: 99,
        rejectReason: 'Dispute accepted',
        refundableAmount: 100000,
      }),
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        type: WalletTransactionType.REFUND,
        amount: 100000,
        referenceId: 'session:11',
      }),
    });
  });
});
