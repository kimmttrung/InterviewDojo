import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';
import { SessionProcessor } from './session.processor';
import { Job } from 'bullmq';
import { NotificationType } from '@prisma/client';
import { MentorPayoutService } from '../../mentor-payout/mentor-payout.service';

describe('SessionProcessor', () => {
  let processor: SessionProcessor;
  let prisma: {
    mockSession: { update: jest.Mock };
    notification: { createMany: jest.Mock };
  };
  let socketService: { emitToUser: jest.Mock };
  let mentorPayoutService: { createPendingPayoutSafely: jest.Mock };
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      mockSession: { update: jest.fn() },
      notification: { createMany: jest.fn() },
    };
    socketService = { emitToUser: jest.fn() };
    mentorPayoutService = { createPendingPayoutSafely: jest.fn() };

    moduleRef = await Test.createTestingModule({
      providers: [
        SessionProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
        { provide: MentorPayoutService, useValue: mentorPayoutService },
      ],
    }).compile();

    processor = moduleRef.get(SessionProcessor);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (moduleRef) await moduleRef.close();
  });

  it('completes a session and notifies every participant', async () => {
    prisma.mockSession.update.mockResolvedValue({ id: 3 });

    // Tạo job giả với tên 'end-session'
    const job = {
      name: 'end-session',
      data: { sessionId: 3, userIds: [1, 2] },
    } as Job<{ sessionId: number; userIds: number[] }>;

    await processor.process(job);

    expect(prisma.mockSession.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { status: 'COMPLETED' },
    });
    expect(mentorPayoutService.createPendingPayoutSafely).toHaveBeenCalledWith(
      3,
    );
    expect(socketService.emitToUser).toHaveBeenNthCalledWith(
      1,
      1,
      'SESSION_ENDED',
      { sessionId: 3 },
    );
    expect(socketService.emitToUser).toHaveBeenNthCalledWith(
      2,
      2,
      'SESSION_ENDED',
      { sessionId: 3 },
    );
  });

  it('creates meeting-room notifications when a session starts', async () => {
    const job = {
      name: 'start-session-notification',
      data: {
        sessionId: 3,
        userIds: [1, 2],
        meetingLink: '/interview/mentor-booking-3?sessionId=3',
      },
    } as Job<any>;

    await processor.process(job);

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 1,
          type: NotificationType.INTERVIEW_UPCOMING,
          targetUrl: '/interview/mentor-booking-3?sessionId=3',
        }),
        expect.objectContaining({
          userId: 2,
          type: NotificationType.INTERVIEW_UPCOMING,
          targetUrl: '/interview/mentor-booking-3?sessionId=3',
        }),
      ],
    });
    expect(prisma.mockSession.update).not.toHaveBeenCalled();
    expect(
      mentorPayoutService.createPendingPayoutSafely,
    ).not.toHaveBeenCalled();
  });
});
