import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  NotificationType,
  PaymentStatus,
  Role,
  SessionMode,
  SessionSource,
  SessionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../socket/socket.service';
import { SessionService } from '../session/session.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StreamService } from '../stream/stream.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('BookingService', () => {
  let service: BookingService;

  // Mock Prisma với các hàm độc lập nằm ngoài transaction
  const prisma = {
    $transaction: jest.fn(),
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    coachingPlan: {
      findUnique: jest.fn(),
    },
  };

  const streamServiceMock = {
    getOrCreateMeetingLink: jest.fn().mockResolvedValue('/meeting/room'),
    createCall: jest.fn(),
    createMeetingRoom: jest.fn(),
  };

  const socketService = {
    emitToUser: jest.fn(),
    emitToRoom: jest.fn(),
  };

  const sessionService = {
    scheduleSessionEnd: jest.fn(),
    scheduleSessionStartNotification: jest.fn(),
  };

  const cloudinaryServiceMock = {
    uploadRawFile: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
        { provide: SessionService, useValue: sessionService },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        { provide: StreamService, useValue: streamServiceMock },
        { provide: CloudinaryService, useValue: cloudinaryServiceMock },
      ],
    }).compile();

    service = moduleRef.get(BookingService);
    jest.clearAllMocks();
  });

  const plan = {
    id: 1,
    isActive: true,
    title: 'Mock',
    description: 'Description',
    duration: 60,
    price: 100,
    mentor: { userId: 2 },
  };

  const booking = {
    id: 20,
    candidateId: 1,
    mentorId: 2,
    slotId: 4,
    coachingPlanId: 1,
    startTime: new Date(Date.now() + 3600000),
    endTime: new Date(Date.now() + 7200000),
    status: BookingStatus.PENDING_PAYMENT,
    snapshotPlanPrice: 100,
    snapshotPlanDuration: 60,
    holdExpiresAt: new Date(Date.now() + 300000),
    createdAt: new Date(),
    coachingPlan: plan,
    candidate: {
      id: 1,
      name: 'Candidate',
      email: 'c@test.com',
      avatarUrl: null,
    },
  };

  it('create - unhappy path startTime after endTime', async () => {
    const start = new Date(Date.now() + 2 * 3600000);
    const end = new Date(Date.now() + 1 * 3600000);

    await expect(
      service.create(1, {
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - unhappy path booking in the past', async () => {
    const start = new Date(Date.now() - 2 * 3600000);
    const end = new Date(Date.now() - 1 * 3600000);

    await expect(
      service.create(1, {
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - unhappy path plan not found', async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 2 * 3600000);

    // FIX: Mock findUnique trực tiếp trên prisma.coachingPlan (vì lệnh này đã được đẩy ra ngoài transaction)
    prisma.coachingPlan.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create(1, {
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - unhappy path duration mismatch', async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 2 * 3600000);

    // FIX: Mock ngoài transaction
    prisma.coachingPlan.findUnique.mockResolvedValueOnce({
      id: 1,
      isActive: true,
      duration: 30, // Khác biệt duration với khoảng cách start-end (60p)
      mentor: { userId: 2 },
    });

    await expect(
      service.create(1, {
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - unhappy path slot unavailable', async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 2 * 3600000);

    // FIX: Mock coachingPlan bên ngoài, slot bên trong transaction
    prisma.coachingPlan.findUnique.mockResolvedValueOnce({
      id: 1,
      isActive: true,
      duration: 60,
      mentor: { userId: 2 },
    });

    prisma.$transaction.mockImplementationOnce(async (cb) =>
      cb({
        slot: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.create(1, {
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - rejects a conflicting active booking', async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(start.getTime() + 3600000);

    // FIX: Mock ngoài transaction
    prisma.coachingPlan.findUnique.mockResolvedValueOnce(plan);

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        slot: { findFirst: jest.fn().mockResolvedValue({ id: 4 }) },
        booking: { findFirst: jest.fn().mockResolvedValue({ id: 99 }) },
      }),
    );

    await expect(
      service.create(1, {
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create - happy path stores snapshots and provided answers', async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(start.getTime() + 3600000);

    // FIX: Mock ngoài transaction
    prisma.coachingPlan.findUnique.mockResolvedValueOnce(plan);

    const tx = {
      slot: { findFirst: jest.fn().mockResolvedValue({ id: 4 }) },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ ...booking, startTime: start, endTime: end }),
      },
    };
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback(tx),
    );

    const result = await service.create(1, {
      coachingPlanId: 1,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      answers: [{ questionId: 5, answerText: 'Answer', fileUrl: null }],
    } as any);

    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: 1,
          mentorId: 2,
          slotId: 4,
          status: BookingStatus.PENDING_PAYMENT,
          snapshotPlanTitle: 'Mock',
          snapshotPlanPrice: 100,
          answers: {
            create: [{ questionId: 5, answerText: 'Answer', fileUrl: null }],
          },
        }),
      }),
    );
    expect(result.id).toBe(20);
  });

  it('payWithWallet - deducts wallet, records payment and notifies users', async () => {
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
        update: jest.fn().mockResolvedValue({
          ...booking,
          status: BookingStatus.PENDING_ACCEPTANCE,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, creditBalance: 300 }),
        update: jest.fn(),
      },
      walletTransaction: { create: jest.fn() },
      payment: { create: jest.fn() },
      notification: { createMany: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await service.payWithWallet(20, 1);

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { creditBalance: 200 },
    });
    expect(tx.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: WalletTransactionType.PAYMENT,
        amount: 100,
        balanceAfter: 200,
      }),
    });
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        amount: 100,
      }),
    });
    expect(tx.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          type: NotificationType.BOOKING_CREATED,
          targetUrl: '/mentor/bookings?bookingId=20',
        }),
        expect.objectContaining({ type: NotificationType.TRANSACTION_SUCCESS }),
      ]),
    });
    expect(result.status).toBe(BookingStatus.PENDING_ACCEPTANCE);
  });

  it('payWithWallet - rejects missing booking and insufficient balance', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({ booking: { findUnique: jest.fn().mockResolvedValue(null) } }),
    );
    await expect(service.payWithWallet(99, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: { findUnique: jest.fn().mockResolvedValue(booking) },
        user: {
          findUnique: jest.fn().mockResolvedValue({ creditBalance: 50 }),
        },
      }),
    );
    await expect(service.payWithWallet(20, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('payWithWallet - rejects invalid state, expired hold and missing price', async () => {
    for (const invalidBooking of [
      { ...booking, status: BookingStatus.PENDING_ACCEPTANCE },
      { ...booking, holdExpiresAt: new Date(Date.now() - 1000) },
      { ...booking, snapshotPlanPrice: null },
    ]) {
      prisma.$transaction.mockImplementationOnce(async (callback) =>
        callback({
          booking: { findUnique: jest.fn().mockResolvedValue(invalidBooking) },
        }),
      );
      await expect(service.payWithWallet(20, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
  });

  it('uploadAttachment - returns upload metadata and wraps upload failures', async () => {
    cloudinaryServiceMock.uploadRawFile
      .mockResolvedValueOnce({
        secure_url: 'https://cdn.test/file.pdf',
        public_id: 'booking/file',
      })
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockRejectedValueOnce({});

    await expect(
      service.uploadAttachment({ buffer: Buffer.from('pdf') } as any),
    ).resolves.toEqual({
      secure_url: 'https://cdn.test/file.pdf',
      public_id: 'booking/file',
    });

    await expect(
      service.uploadAttachment({ buffer: Buffer.from('bad') } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.uploadAttachment({ buffer: Buffer.from('bad') } as any),
    ).rejects.toThrow('Lỗi upload Cloudinary');
  });

  it('accept - creates a session, schedules its ending and emits updates', async () => {
    const pending = { ...booking, status: BookingStatus.PENDING_ACCEPTANCE };
    const mockSession = {
      id: 80,
      scheduledAt: pending.startTime,
      durationMinutes: 60,
      meetingLink: null,
    };
    const expectedMeetingLink = '/interview/mentor-booking-80?sessionId=80';
    streamServiceMock.getOrCreateMeetingLink.mockResolvedValueOnce(
      expectedMeetingLink,
    );

    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(pending),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockResolvedValue({ ...pending, status: BookingStatus.ACCEPTED }),
      },
      mockSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockSession),
        update: jest.fn().mockResolvedValue({
          ...mockSession,
          meetingLink: expectedMeetingLink,
        }),
      },
      bookingActionLog: { create: jest.fn() },
      notification: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await service.accept(20, 2);

    expect(tx.mockSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: SessionStatus.SCHEDULED,
        source: SessionSource.MENTOR_BOOKING,
        mode: SessionMode.MEET,
      }),
    });
    expect(sessionService.scheduleSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 80 }),
      [2, 1],
    );
    expect(tx.mockSession.update).toHaveBeenCalledWith({
      where: { id: 80 },
      data: { meetingLink: expectedMeetingLink },
    });
    expect(
      sessionService.scheduleSessionStartNotification,
    ).toHaveBeenCalledWith(expect.objectContaining({ id: 80 }), [2, 1]);

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        type: NotificationType.INTERVIEW_UPCOMING,
        targetUrl: '/sessions',
      }),
    });

    expect(socketService.emitToUser).toHaveBeenCalledTimes(4);
    expect(result.status).toBe(BookingStatus.ACCEPTED);
  });

  it('accept - still succeeds when queue scheduling fails', async () => {
    const pending = { ...booking, status: BookingStatus.PENDING_ACCEPTANCE };
    const mockSession = {
      id: 81,
      scheduledAt: pending.startTime,
      durationMinutes: 60,
      meetingLink: null,
    };
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(pending),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockResolvedValue({ ...pending, status: BookingStatus.ACCEPTED }),
      },
      mockSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockSession),
        update: jest.fn().mockResolvedValue({
          ...mockSession,
          meetingLink: '/meeting/81',
        }),
      },
      bookingActionLog: { create: jest.fn() },
      notification: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    streamServiceMock.getOrCreateMeetingLink.mockResolvedValueOnce(
      '/meeting/81',
    );
    sessionService.scheduleSessionEnd.mockRejectedValueOnce(
      new Error('queue unavailable'),
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.accept(20, 2)).resolves.toEqual(
      expect.objectContaining({ status: BookingStatus.ACCEPTED }),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to schedule session jobs'),
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it('accept - rejects when transaction does not return a booking or session', async () => {
    prisma.$transaction.mockImplementationOnce(async () => undefined);

    await expect(service.accept(20, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('accept - uses default duration when booking snapshot duration is missing', async () => {
    const pending = {
      ...booking,
      status: BookingStatus.PENDING_ACCEPTANCE,
      snapshotPlanDuration: null,
    };
    const mockSession = {
      id: 82,
      scheduledAt: pending.startTime,
      durationMinutes: 60,
      meetingLink: null,
    };
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(pending),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockResolvedValue({ ...pending, status: BookingStatus.ACCEPTED }),
      },
      mockSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockSession),
        update: jest.fn().mockResolvedValue({
          ...mockSession,
          meetingLink: '/meeting/82',
        }),
      },
      bookingActionLog: { create: jest.fn() },
      notification: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    streamServiceMock.getOrCreateMeetingLink.mockResolvedValueOnce(
      '/meeting/82',
    );

    await service.accept(20, 2);

    expect(tx.mockSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ durationMinutes: 60 }),
    });
  });

  it('accept - rejects invalid ownership, status and time conflicts', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({ booking: { findUnique: jest.fn().mockResolvedValue(null) } }),
    );
    await expect(service.accept(99, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue(booking),
        },
      }),
    );
    await expect(service.accept(20, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    const pending = { ...booking, status: BookingStatus.PENDING_ACCEPTANCE };
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue(pending),
          findFirst: jest.fn().mockResolvedValue({ id: 77 }),
        },
      }),
    );
    await expect(service.accept(20, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reject - refunds paid booking, logs reason and emits rejection', async () => {
    const pending = { ...booking, status: BookingStatus.PENDING_ACCEPTANCE };
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(pending),
        update: jest
          .fn()
          .mockResolvedValue({ ...pending, status: BookingStatus.REJECTED }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ creditBalance: 20 }),
        update: jest.fn(),
      },
      walletTransaction: { create: jest.fn() },
      payment: { updateMany: jest.fn() },
      bookingActionLog: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await service.reject(20, 2, 'Unavailable');

    expect(tx.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: WalletTransactionType.REFUND,
        amount: 100,
        balanceAfter: 120,
      }),
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { bookingId: 20, status: PaymentStatus.PAID },
      data: expect.objectContaining({ status: PaymentStatus.REFUNDED }),
    });
    expect(tx.bookingActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'REJECT', note: 'Unavailable' }),
    });
    expect(socketService.emitToUser).toHaveBeenCalledWith(
      1,
      'SESSION_REJECTED',
      { bookingId: 20, reason: 'Unavailable' },
    );
    expect(result.status).toBe(BookingStatus.REJECTED);
  });

  it('reject - rejects missing, foreign, or non-pending bookings', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({ booking: { findUnique: jest.fn().mockResolvedValue(null) } }),
    );
    await expect(service.reject(404, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({ ...booking, mentorId: 99 }),
        },
      }),
    );
    await expect(service.reject(20, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ ...booking, status: BookingStatus.ACCEPTED }),
        },
      }),
    );
    await expect(service.reject(20, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('findAll scopes results by role and rejects unauthorized roles', async () => {
    prisma.booking.count.mockResolvedValue(1);
    prisma.booking.findMany.mockResolvedValue([booking]);

    const result = await service.findAll(
      { status: BookingStatus.PENDING_PAYMENT } as any,
      { sub: 1, role: Role.CANDIDATE },
    );
    expect(prisma.booking.count).toHaveBeenCalledWith({
      where: { status: BookingStatus.PENDING_PAYMENT, candidateId: 1 },
    });
    expect(result.items).toHaveLength(1);

    await service.findAll({} as any, { sub: 2, role: Role.MENTOR });
    expect(prisma.booking.count).toHaveBeenLastCalledWith({
      where: { mentorId: 2 },
    });

    await expect(
      service.findAll({} as any, { sub: 1, role: 'UNKNOWN' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findById returns answers and rejection reason only to owner or admin', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      answers: [
        {
          questionId: 1,
          answerText: 'A',
          fileUrl: null,
          question: { question: 'Q' },
        },
      ],
      logs: [{ note: 'Reason' }],
    });

    const result: any = await service.findById(20, {
      sub: 1,
      role: Role.CANDIDATE,
    });
    expect(result.answers[0].questionText).toBe('Q');
    expect(result.rejectionReason).toBe('Reason');

    await expect(
      service.findById(20, { sub: 99, role: Role.CANDIDATE }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.booking.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.findById(99, { sub: 1, role: Role.ADMIN }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateStatus dispatches supported transitions and rejects all others', async () => {
    jest.spyOn(service, 'accept').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(service, 'reject').mockResolvedValue({ id: 2 } as any);

    await service.updateStatus(1, 2, { status: BookingStatus.ACCEPTED });
    await service.updateStatus(1, 2, { status: BookingStatus.REJECTED });
    expect(service.accept).toHaveBeenCalledWith(1, 2);
    expect(service.reject).toHaveBeenCalledWith(1, 2);
    await expect(
      service.updateStatus(1, 2, { status: BookingStatus.CANCELLED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('mapToBookingResponse covers optional relation and answer fallbacks', () => {
    const mappedWithoutRelations = (service as any).mapToBookingResponse({
      ...booking,
      coachingPlan: null,
      candidate: null,
      mentor: null,
    });
    expect(mappedWithoutRelations.planDetails).toBeUndefined();
    expect(mappedWithoutRelations.candidate).toBeUndefined();
    expect(mappedWithoutRelations.mentor).toBeUndefined();

    const mappedAnswers = (service as any).mapToBookingResponse(
      {
        ...booking,
        answers: [
          { questionId: 1, question: null, answerText: 'A', fileUrl: null },
        ],
      },
      true,
    );
    expect(mappedAnswers.answers[0].questionText).toBe('');
  });
});
