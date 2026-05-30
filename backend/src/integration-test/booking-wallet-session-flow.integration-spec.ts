import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import {
  BookingStatus,
  SessionMode,
  SessionSource,
  SessionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { BookingService } from '../modules/booking/booking.service';
import { SessionTab } from '../modules/session/dto/get-sessions.dto';
import { SessionService } from '../modules/session/session.service';
import { MentorPayoutService } from '../modules/mentor-payout/mentor-payout.service';
import { SocketService } from '../modules/socket/socket.service';
import { WalletService } from '../modules/wallet/wallet.service';
import { StreamService } from '../modules/stream/stream.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

describe('Booking Wallet Session Integration', () => {
  let bookingService: BookingService;
  let walletService: WalletService;
  let sessionService: SessionService;

  const candidate = {
    id: 1,
    name: 'Candidate',
    email: 'candidate@test.com',
    avatarUrl: null,
    creditBalance: 500,
  };
  const mentor = {
    id: 2,
    name: 'Mentor',
    email: 'mentor@test.com',
    avatarUrl: null,
  };
  const plan = {
    id: 3,
    title: 'Backend Interview',
    description: 'Practice backend interview',
    duration: 60,
    price: 100,
    isActive: true,
    mentor: { userId: mentor.id },
  };
  const state: {
    booking?: any;
    session?: any;
    walletTransactions: any[];
    payments: any[];
    notifications: any[];
  } = {
    walletTransactions: [],
    payments: [],
    notifications: [],
  };

  const socketService = { emitToUser: jest.fn() };
  const queue = {
    getJob: jest.fn(),
    add: jest.fn(),
    removeJobs: jest.fn(),
    addBulk: jest.fn(),
    remove: jest.fn(),
  };

  const streamServiceMock = {
    getOrCreateMeetingLink: jest
      .fn()
      .mockResolvedValue('/interview/mentor-booking-30?sessionId=30'),
    createCall: jest.fn(),
    createMeetingRoom: jest.fn(),
  };

  const prisma: any = {
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
    coachingPlan: { findUnique: jest.fn(async () => plan) },
    slot: { findFirst: jest.fn(async () => ({ id: 4 })) },
    user: {
      findUnique: jest.fn(async ({ where }: any) =>
        where.id === candidate.id ? candidate : mentor,
      ),
      update: jest.fn(async ({ where, data }: any) => {
        if (where.id === candidate.id) Object.assign(candidate, data);
        return candidate;
      }),
    },
    booking: {
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.id?.not) return null;
        return null;
      }),
      findUnique: jest.fn(async () => state.booking),
      create: jest.fn(async ({ data }: any) => {
        state.booking = {
          id: 10,
          ...data,
          createdAt: new Date(),
          coachingPlan: plan,
          candidate,
          mentor,
        };
        return state.booking;
      }),
      update: jest.fn(async ({ data }: any) => {
        Object.assign(state.booking, data, {
          coachingPlan: plan,
          candidate,
          mentor,
        });
        return state.booking;
      }),
    },
    walletTransaction: {
      create: jest.fn(async ({ data }: any) => {
        const tx = {
          id: state.walletTransactions.length + 1,
          ...data,
          createdAt: new Date(),
        };
        state.walletTransactions.push(tx);
        return tx;
      }),
    },
    payment: {
      create: jest.fn(async ({ data }: any) => {
        state.payments.push(data);
        return data;
      }),
    },
    notification: {
      createMany: jest.fn(async ({ data }: any) => {
        state.notifications.push(...data);
        return { count: data.length };
      }),
      create: jest.fn(async ({ data }: any) => {
        state.notifications.push(data);
        return data;
      }),
    },
    bookingActionLog: { create: jest.fn(async ({ data }: any) => data) },
    mockSession: {
      findFirst: jest.fn(async () => state.session ?? null),
      create: jest.fn(async ({ data }: any) => {
        state.session = { id: 30, ...data };
        return state.session;
      }),
      update: jest.fn(async ({ data }: any) => {
        Object.assign(state.session, data);
        return state.session;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        if (!state.session || state.session.status !== where.status) return [];
        return [
          {
            ...state.session,
            booking: {
              ...state.booking,
              coachingPlan: plan,
              candidate,
              mentor,
            },
            match: null,
          },
        ];
      }),
      count: jest.fn(async ({ where }: any) =>
        state.session?.status === where.status ? 1 : 0,
      ),
    },
  };

  beforeEach(async () => {
    candidate.creditBalance = 500;
    state.booking = undefined;
    state.session = undefined;
    state.walletTransactions = [];
    state.payments = [];
    state.notifications = [];
    jest.clearAllMocks();
    queue.getJob.mockResolvedValue(null);
    streamServiceMock.getOrCreateMeetingLink.mockResolvedValue(
      '/interview/mentor-booking-30?sessionId=30',
    );

    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        BookingService,
        WalletService,
        SessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
        { provide: getQueueToken('session'), useValue: queue },
        { provide: StreamService, useValue: streamServiceMock },
        {
          provide: CloudinaryService,
          useValue: {
            uploadRawFile: jest.fn().mockResolvedValue({
              secure_url: 'https://mock-url.com/file.pdf',
              public_id: 'mock_id',
            }),
          },
        },
        {
          provide: MentorPayoutService,
          useValue: { payoutCompletedSessionSafely: jest.fn() },
        },
      ],
    }).compile();
    bookingService = moduleRef.get(BookingService);
    walletService = moduleRef.get(WalletService);
    sessionService = moduleRef.get(SessionService);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('candidate books and pays, mentor accepts, then candidate sees an upcoming session', async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const created = await bookingService.create(candidate.id, {
      coachingPlanId: plan.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      answers: [],
    });
    expect(created.status).toBe(BookingStatus.PENDING_PAYMENT);

    const paid = await bookingService.payWithWallet(created.id, candidate.id);
    expect(paid.status).toBe(BookingStatus.PENDING_ACCEPTANCE);
    await expect(walletService.getMyWallet(candidate.id)).resolves.toEqual({
      creditBalance: 400,
    });
    expect(state.walletTransactions[0]).toEqual(
      expect.objectContaining({
        type: WalletTransactionType.PAYMENT,
        amount: 100,
      }),
    );

    const accepted = await bookingService.accept(created.id, mentor.id);
    expect(accepted.status).toBe(BookingStatus.ACCEPTED);
    expect(state.session).toEqual(
      expect.objectContaining({
        status: SessionStatus.SCHEDULED,
        source: SessionSource.MENTOR_BOOKING,
        mode: SessionMode.MEET,
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'end-session',
      { sessionId: 30, userIds: [mentor.id, candidate.id] },
      expect.objectContaining({ jobId: 'session-30' }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'start-session-notification',
      {
        sessionId: 30,
        userIds: [mentor.id, candidate.id],
        meetingLink: '/interview/mentor-booking-30?sessionId=30',
      },
      expect.objectContaining({ jobId: 'session-start-30' }),
    );

    const sessions = await sessionService.getSessions(candidate.id, {
      tab: SessionTab.UPCOMING,
    });
    expect(sessions.items[0]).toEqual(
      expect.objectContaining({
        id: 30,
        status: 'UPCOMING',
        opponentName: 'Mentor',
        coachingPlan: 'Backend Interview',
      }),
    );
    expect(state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: mentor.id,
          targetUrl: `/mentor/bookings?bookingId=${created.id}`,
        }),
        expect.objectContaining({
          userId: candidate.id,
          targetUrl: '/wallet',
        }),
        expect.objectContaining({
          userId: candidate.id,
          targetUrl: '/sessions',
        }),
      ]),
    );
    expect(state.notifications).toHaveLength(3);
  });
});
