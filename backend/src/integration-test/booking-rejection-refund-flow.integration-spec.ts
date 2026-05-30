import { Test } from '@nestjs/testing';
import {
  BookingStatus,
  PaymentStatus,
  WalletTransactionType,
} from '@prisma/client';
import { BookingService } from '../modules/booking/booking.service';
import { SessionService } from '../modules/session/session.service';
import { SocketService } from '../modules/socket/socket.service';
import { WalletService } from '../modules/wallet/wallet.service';
import { StreamService } from '../modules/stream/stream.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

describe('Booking Rejection Refund Integration', () => {
  let bookingService: BookingService;
  let walletService: WalletService;

  const candidate = { id: 1, creditBalance: 400 };
  const booking: any = {
    id: 10,
    candidateId: 1,
    mentorId: 2,
    coachingPlanId: 3,
    slotId: 4,
    startTime: new Date('2026-06-01T10:00:00.000Z'),
    endTime: new Date('2026-06-01T11:00:00.000Z'),
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    status: BookingStatus.PENDING_ACCEPTANCE,
    snapshotPlanPrice: 100,
    coachingPlan: { title: 'Mock', price: 100, duration: 60 },
    candidate: { id: 1, name: 'Candidate', email: 'candidate@test.com' },
  };
  const transactions: any[] = [];
  const payments = [{ bookingId: 10, status: PaymentStatus.PAID }];
  const logs: any[] = [];
  const socketService = { emitToUser: jest.fn() };
  const streamServiceMock = {
    getOrCreateMeetingLink: jest.fn().mockResolvedValue('/meeting/room'),
    createCall: jest.fn(),
    createMeetingRoom: jest.fn(),
  };
  const prisma: any = {
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
    booking: {
      findUnique: jest.fn(async () => booking),
      update: jest.fn(async ({ data }: any) => Object.assign(booking, data)),
    },
    user: {
      findUnique: jest.fn(async () => ({ ...candidate })),
      update: jest.fn(async ({ data }: any) => Object.assign(candidate, data)),
    },
    walletTransaction: {
      create: jest.fn(async ({ data }: any) => {
        transactions.push(data);
        return data;
      }),
    },
    payment: {
      updateMany: jest.fn(async ({ data }: any) => {
        Object.assign(payments[0], data);
        return { count: 1 };
      }),
    },
    bookingActionLog: {
      create: jest.fn(async ({ data }: any) => {
        logs.push(data);
        return data;
      }),
    },
  };

  beforeEach(async () => {
    candidate.creditBalance = 400;
    booking.status = BookingStatus.PENDING_ACCEPTANCE;
    payments[0].status = PaymentStatus.PAID;
    transactions.length = 0;
    logs.length = 0;
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        BookingService,
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
        {
          provide: SessionService,
          useValue: { scheduleSessionEnd: jest.fn() },
        },
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
      ],
    }).compile();
    bookingService = moduleRef.get(BookingService);
    walletService = moduleRef.get(WalletService);
  });

  it('mentor rejection refunds candidate wallet and records the rejection reason', async () => {
    const result = await bookingService.reject(
      booking.id,
      booking.mentorId,
      'Schedule changed',
    );

    expect(result.status).toBe(BookingStatus.REJECTED);
    await expect(walletService.getMyWallet(candidate.id)).resolves.toEqual({
      creditBalance: 500,
    });
    expect(transactions).toEqual([
      expect.objectContaining({
        type: WalletTransactionType.REFUND,
        amount: 100,
        balanceBefore: 400,
        balanceAfter: 500,
      }),
    ]);
    expect(payments[0]).toEqual(
      expect.objectContaining({
        status: PaymentStatus.REFUNDED,
        refundedAmount: 100,
      }),
    );
    expect(logs[0]).toEqual(
      expect.objectContaining({ action: 'REJECT', note: 'Schedule changed' }),
    );
    expect(socketService.emitToUser).toHaveBeenCalledWith(
      candidate.id,
      'SESSION_REJECTED',
      { bookingId: booking.id, reason: 'Schedule changed' },
    );
  });
});
