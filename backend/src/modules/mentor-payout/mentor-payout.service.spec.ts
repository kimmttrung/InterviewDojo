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
      mockSession: { findUnique: jest.fn(), findMany: jest.fn() },
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
        findMany: jest.fn(),
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

  it('treats concurrent duplicate payout creation as idempotent', async () => {
    prisma.$transaction.mockRejectedValueOnce({
      code: 'P2002',
      meta: { target: ['session_id'] },
    });
    prisma.mentorPayout.findUnique.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    await expect(service.payoutCompletedSession(11)).resolves.toEqual({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    expect(prisma.mentorPayout.findUnique).toHaveBeenCalledWith({
      where: { sessionId: 11 },
      include: expect.any(Object),
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('retries payout for a session by delegating to automatic payout', async () => {
    jest
      .spyOn(service, 'payoutCompletedSession')
      .mockResolvedValue({
        ...payout,
        status: MentorPayoutStatus.COMPLETED,
      } as any);

    await expect(service.retryPayoutForSession(11)).resolves.toEqual(
      expect.objectContaining({ status: MentorPayoutStatus.COMPLETED }),
    );
    expect(service.payoutCompletedSession).toHaveBeenCalledWith(11);
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

  it('returns null for sessions that are not payable mentor bookings', async () => {
    prisma.mockSession.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 12,
        status: SessionStatus.SCHEDULED,
        source: SessionSource.MENTOR_BOOKING,
        booking: { status: BookingStatus.ACCEPTED },
      })
      .mockResolvedValueOnce({
        id: 13,
        status: SessionStatus.COMPLETED,
        source: SessionSource.P2P_MATCH,
        booking: { status: BookingStatus.ACCEPTED },
      })
      .mockResolvedValueOnce({
        id: 14,
        status: SessionStatus.COMPLETED,
        source: SessionSource.MENTOR_BOOKING,
        booking: { status: BookingStatus.REJECTED },
      });

    await expect(service.payoutCompletedSession(404)).rejects.toThrow(
      'Session not found',
    );
    await expect(service.payoutCompletedSession(12)).resolves.toBeNull();
    await expect(service.payoutCompletedSession(13)).resolves.toBeNull();
    await expect(service.payoutCompletedSession(14)).resolves.toBeNull();
  });

  it('rejects payout when booking price or platform fee config is invalid', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      status: SessionStatus.COMPLETED,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        status: BookingStatus.ACCEPTED,
        snapshotPlanPrice: 0,
      },
    });

    await expect(service.payoutCompletedSession(11)).rejects.toThrow(
      'Booking price is not available',
    );

    const invalidConfigService = new MentorPayoutService(prisma, {
      get: jest.fn().mockReturnValue('150'),
    } as unknown as ConfigService);
    await expect(
      invalidConfigService.payoutCompletedSession(11),
    ).rejects.toThrow('PLATFORM_FEE_PERCENT is invalid');
  });

  it('marks payout failed when mentor is missing during automatic payout', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      status: SessionStatus.COMPLETED,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: payout,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        status: BookingStatus.COMPLETED,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.walletTransaction.findFirst.mockResolvedValue(null);
    prisma.mentorPayout.update
      .mockResolvedValueOnce({ ...payout, status: MentorPayoutStatus.PENDING })
      .mockResolvedValueOnce({
        ...payout,
        status: MentorPayoutStatus.FAILED,
        failureReason: 'Mentor not found',
      });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.payoutCompletedSession(11)).resolves.toEqual(
      expect.objectContaining({
        status: MentorPayoutStatus.FAILED,
        failureReason: 'Mentor not found',
      }),
    );
  });

  it('creates a completed payout record when payout transaction already exists without payout row', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      status: SessionStatus.COMPLETED,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        status: BookingStatus.COMPLETED,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.walletTransaction.findFirst.mockResolvedValue({ id: 1 });
    prisma.mentorPayout.create.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.COMPLETED,
    });

    await expect(service.payoutCompletedSession(11)).resolves.toEqual(
      expect.objectContaining({ status: MentorPayoutStatus.COMPLETED }),
    );
    expect(prisma.mentorPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: MentorPayoutStatus.COMPLETED }),
    });
  });

  it('logs and marks payout failed in safe mode', async () => {
    const error = new Error('database down');
    prisma.$transaction.mockRejectedValueOnce(error);
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.mentorPayout.create.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.FAILED,
    });
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(prisma.mentorPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 11,
        status: MentorPayoutStatus.FAILED,
        failureReason: 'database down',
      }),
    });
  });

  it('safe mode skips failure marking for non-mentor booking sessions', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('fail'));
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.SOLO,
      booking: null,
      mentorPayout: null,
    });
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(prisma.mentorPayout.create).not.toHaveBeenCalled();
    expect(prisma.mentorPayout.update).not.toHaveBeenCalled();
  });

  it('safe mode updates an existing payout failure row', async () => {
    prisma.$transaction.mockRejectedValueOnce('plain failure');
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: { id: 7 },
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.mentorPayout.update.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.FAILED,
    });
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(prisma.mentorPayout.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        status: MentorPayoutStatus.FAILED,
        failureReason: 'Unknown payout failure',
      },
    });
  });

  it('safe mode updates failure reason after a duplicate failure row create', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('duplicate fail'));
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.mentorPayout.create.mockRejectedValue({ code: 'P2002' });
    prisma.mentorPayout.update.mockResolvedValue({});
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(prisma.mentorPayout.update).toHaveBeenCalledWith({
      where: { sessionId: 11 },
      data: { failureReason: 'duplicate fail' },
    });
  });

  it('safe mode logs when marking payout failure itself fails', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('outer fail'));
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.mentorPayout.create.mockRejectedValue(new Error('mark failed'));
    const loggerSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to mark mentor payout as failed'),
      expect.any(String),
    );
  });

  it('safe mode creates a failure row with zero gross amount when price is missing', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('outer fail'));
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: null,
      },
    });
    prisma.mentorPayout.create.mockResolvedValue({});
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(prisma.mentorPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        grossAmount: 0,
        platformFeeAmount: 0,
        mentorEarning: 0,
        refundableAmount: 0,
      }),
    });
  });

  it('safe mode logs non-error failures while marking payout failure', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('outer fail'));
    prisma.mockSession.findUnique.mockResolvedValue({
      id: 11,
      source: SessionSource.MENTOR_BOOKING,
      mentorPayout: null,
      booking: {
        id: 22,
        mentorId: 2,
        candidateId: 1,
        snapshotPlanPrice: 100000,
      },
    });
    prisma.mentorPayout.create.mockRejectedValue('plain mark failed');
    const loggerSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(service.payoutCompletedSessionSafely(11)).resolves.toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to mark mentor payout as failed'),
      'plain mark failed',
    );
  });

  it('lists payouts with safe pagination and optional status filter', async () => {
    prisma.mentorPayout.count.mockResolvedValue(1);
    prisma.mentorPayout.findMany.mockResolvedValue([payout]);

    const result = await service.getPayouts({
      page: 2,
      limit: 500,
      status: MentorPayoutStatus.PENDING,
    });

    expect(prisma.mentorPayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: MentorPayoutStatus.PENDING },
        skip: 100,
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(result.meta).toEqual({
      total: 1,
      page: 2,
      limit: 100,
      totalPages: 1,
    });
  });

  it('lists payouts with default pagination when no filter is provided', async () => {
    prisma.mentorPayout.count.mockResolvedValue(0);
    prisma.mentorPayout.findMany.mockResolvedValue([]);

    const result = await service.getPayouts({});

    expect(prisma.mentorPayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 15,
      }),
    );
    expect(result.meta).toEqual({
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 0,
    });
  });

  it('lists retryable payout sessions excluding already paid references', async () => {
    const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
    prisma.mockSession.findMany.mockResolvedValue([
      {
        id: 11,
        scheduledAt,
        durationMinutes: 60,
        status: SessionStatus.COMPLETED,
        endedAt: new Date('2026-01-01T11:00:00.000Z'),
        mentorPayout: null,
        booking: {
          id: 22,
          mentorId: 2,
          candidateId: 1,
          startTime: scheduledAt,
          endTime: new Date('2026-01-01T11:00:00.000Z'),
          snapshotPlanTitle: 'Backend',
          snapshotPlanPrice: 100000,
          status: BookingStatus.COMPLETED,
          mentor: {
            id: 2,
            name: 'Mentor',
            email: 'm@test.com',
            avatarUrl: null,
          },
          candidate: {
            id: 1,
            name: 'Candidate',
            email: 'c@test.com',
            avatarUrl: null,
          },
        },
      },
      {
        id: 12,
        scheduledAt,
        durationMinutes: 60,
        status: SessionStatus.COMPLETED,
        endedAt: null,
        mentorPayout: { ...payout, id: 8, status: MentorPayoutStatus.FAILED },
        booking: {
          id: 23,
          mentorId: 2,
          candidateId: 1,
          startTime: scheduledAt,
          endTime: new Date('2026-01-01T11:00:00.000Z'),
          snapshotPlanTitle: 'Frontend',
          snapshotPlanPrice: 50000,
          status: BookingStatus.COMPLETED,
          mentor: {
            id: 2,
            name: 'Mentor',
            email: 'm@test.com',
            avatarUrl: null,
          },
          candidate: {
            id: 1,
            name: 'Candidate',
            email: 'c@test.com',
            avatarUrl: null,
          },
        },
      },
    ]);
    prisma.walletTransaction.findMany.mockResolvedValue([
      { referenceId: 'session:11' },
    ]);

    const result = await service.getRetryablePayoutSessions({
      status: MentorPayoutStatus.FAILED,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 8,
        sessionId: 12,
        grossAmount: 50000,
        platformFeeAmount: 5000,
        mentorEarning: 45000,
        status: MentorPayoutStatus.FAILED,
      }),
    );
  });

  it('handles retryable payout sessions when there are no candidate sessions', async () => {
    prisma.mockSession.findMany.mockResolvedValue([]);

    await expect(service.getRetryablePayoutSessions({})).resolves.toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: 15, totalPages: 0 },
    });
    expect(prisma.walletTransaction.findMany).not.toHaveBeenCalled();
  });

  it('lists retryable payout sessions with default payout fields and default platform fee config', async () => {
    const defaultFeeService = new MentorPayoutService(prisma, {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService);
    const scheduledAt = new Date('2026-01-02T10:00:00.000Z');
    prisma.mockSession.findMany.mockResolvedValue([
      {
        id: 30,
        scheduledAt,
        durationMinutes: 45,
        status: SessionStatus.COMPLETED,
        endedAt: null,
        mentorPayout: null,
        booking: {
          id: 40,
          mentorId: 2,
          candidateId: 1,
          startTime: scheduledAt,
          endTime: new Date('2026-01-02T10:45:00.000Z'),
          snapshotPlanTitle: 'System Design',
          snapshotPlanPrice: null,
          status: BookingStatus.COMPLETED,
          mentor: {
            id: 2,
            name: 'Mentor',
            email: 'm@test.com',
            avatarUrl: null,
          },
          candidate: {
            id: 1,
            name: 'Candidate',
            email: 'c@test.com',
            avatarUrl: null,
          },
        },
      },
    ]);
    prisma.walletTransaction.findMany.mockResolvedValue([]);

    const result = await defaultFeeService.getRetryablePayoutSessions({});

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 30,
        status: MentorPayoutStatus.PENDING,
        failureReason: null,
        createdAt: scheduledAt,
        reviewedAt: null,
        grossAmount: 0,
        platformFeePercent: 10,
      }),
    );
  });

  it('rejects approving missing, non-pending, or mentorless payouts', async () => {
    prisma.mentorPayout.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.mentorPayout.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...payout,
        status: MentorPayoutStatus.COMPLETED,
      });
    prisma.mentorPayout.findUniqueOrThrow.mockResolvedValueOnce(payout);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.approvePayout(404, 99)).rejects.toThrow(
      'Payout not found',
    );
    await expect(service.approvePayout(7, 99)).rejects.toThrow(
      'Payout is not pending',
    );
    await expect(service.approvePayout(7, 99)).rejects.toThrow(
      'Mentor not found',
    );
  });

  it('rejects invalid payout rejection states and refund amounts', async () => {
    prisma.mentorPayout.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...payout,
        status: MentorPayoutStatus.COMPLETED,
      })
      .mockResolvedValueOnce(payout)
      .mockResolvedValueOnce(payout);
    prisma.mentorPayout.findUniqueOrThrow.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.REJECTED,
      refundableAmount: 0,
    });
    prisma.mentorPayout.update.mockResolvedValue({
      ...payout,
      status: MentorPayoutStatus.REJECTED,
      refundableAmount: 0,
    });

    await expect(service.rejectPayout(404, 99, 'Missing')).rejects.toThrow(
      'Payout not found',
    );
    await expect(service.rejectPayout(7, 99, 'Done')).rejects.toThrow(
      'Payout is not pending',
    );
    await expect(
      service.rejectPayout(7, 99, 'Invalid', 200000),
    ).rejects.toThrow('Refund amount is invalid');
    await expect(
      service.rejectPayout(7, 99, 'No refund', 0),
    ).resolves.toBeDefined();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects payout rejection when candidate is missing', async () => {
    prisma.mentorPayout.findUnique.mockResolvedValue(payout);
    prisma.mentorPayout.update.mockResolvedValue(payout);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.rejectPayout(7, 99, 'Refund')).rejects.toThrow(
      'Candidate not found',
    );
  });
});
