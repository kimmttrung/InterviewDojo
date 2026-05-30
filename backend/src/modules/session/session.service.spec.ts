import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { BookingStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSessionsDto, SessionTab } from './dto/get-sessions.dto';
import { SessionService } from './session.service';
import { SocketService } from '../socket/socket.service';
import { StreamService } from '../stream/stream.service';
import { MentorPayoutService } from '../mentor-payout/mentor-payout.service';

describe('SessionService', () => {
  let service: SessionService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const prisma = {
    mockSession: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const sessionQueue = {
    getJob: jest.fn(),
    add: jest.fn(),
    addBulk: jest.fn(),
    remove: jest.fn(),
  };

  const mockSocketService = {
    emitToUser: jest.fn(),
    emitToRoom: jest.fn(),
  };

  const mockStreamService = {
    getOrCreateMeetingLink: jest.fn().mockResolvedValue('/meeting/room'),
    createCall: jest.fn(),
    createMeetingRoom: jest.fn(),
  };

  const mockMentorPayoutService = {
    payoutCompletedSessionSafely: jest.fn(),
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('session'), useValue: sessionQueue },
        { provide: SocketService, useValue: mockSocketService },
        { provide: StreamService, useValue: mockStreamService },
        { provide: MentorPayoutService, useValue: mockMentorPayoutService },
      ],
    }).compile();

    service = moduleRef.get(SessionService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('SessionService - CronJob: handleOverdueSessions', () => {
    let scheduleSpy: jest.SpyInstance;

    beforeEach(() => {
      // Đặt thời gian giả lập để test new Date()
      jest.useFakeTimers().setSystemTime(new Date('2026-05-01T00:00:00.000Z'));

      // Spy vào hàm scheduleAllUpcomingSessions để xem nó có được gọi không
      scheduleSpy = jest
        .spyOn(service, 'scheduleAllUpcomingSessions')
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    it('không làm gì cả nếu không có session nào quá hạn', async () => {
      // Giả lập DB trả về mảng rỗng ngay lần query đầu tiên
      prisma.mockSession.findMany.mockResolvedValueOnce([]);

      await service.handleOverdueSessions();

      // Hàm update không bao giờ được gọi
      expect(prisma.mockSession.updateMany).not.toHaveBeenCalled();
      // Không có dữ liệu cập nhật nên không gọi schedule
      expect(scheduleSpy).not.toHaveBeenCalled();
    });

    it('quét và cập nhật 1 lô (batch) nếu số lượng session quá hạn ít hơn batchSize', async () => {
      const mockSessions = [
        {
          id: 1,
          scheduledAt: new Date('2026-04-01T00:00:00.000Z'),
          durationMinutes: 60,
        },
        {
          id: 2,
          scheduledAt: new Date('2026-04-01T00:00:00.000Z'),
          durationMinutes: 60,
        },
      ];

      // Lần 1: Trả về 2 bản ghi
      // Lần 2: Trả về mảng rỗng để thoát vòng lặp while
      prisma.mockSession.findMany
        .mockResolvedValueOnce(mockSessions as any)
        .mockResolvedValueOnce([]);

      prisma.mockSession.updateMany.mockResolvedValue({ count: 2 });

      await service.handleOverdueSessions();

      // Kiểm tra câu lệnh SELECT
      expect(prisma.mockSession.findMany).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.SCHEDULED,
          scheduledAt: { lt: expect.any(Date) },
        },
        select: { id: true, scheduledAt: true, durationMinutes: true },
        take: 100, // Kiểm tra xem có đúng batchSize bạn đặt không (ví dụ là 100)
        orderBy: { id: 'asc' },
      });

      // Kiểm tra câu lệnh UPDATE lấy đúng ID
      expect(prisma.mockSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { status: SessionStatus.COMPLETED },
      });

      // // Đã có cập nhật thành công nên phải gọi hàm schedule
      // expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('xử lý cuốn chiếu nhiều lô (batches) nếu số lượng session quá lớn', async () => {
      // Giả lập 2 lô dữ liệu
      const batch1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        scheduledAt: new Date('2026-04-01T00:00:00.000Z'),
        durationMinutes: 60,
      }));
      const batch2 = [
        {
          id: 101,
          scheduledAt: new Date('2026-04-01T00:00:00.000Z'),
          durationMinutes: 60,
        },
        {
          id: 102,
          scheduledAt: new Date('2026-04-01T00:00:00.000Z'),
          durationMinutes: 60,
        },
      ];

      prisma.mockSession.findMany
        .mockResolvedValueOnce(batch1 as any) // Vòng 1
        .mockResolvedValueOnce(batch2 as any) // Vòng 2
        .mockResolvedValueOnce([]); // Vòng 3: Hết dữ liệu, thoát

      prisma.mockSession.updateMany
        .mockResolvedValueOnce({ count: 100 })
        .mockResolvedValueOnce({ count: 2 });

      await service.handleOverdueSessions();

      // Hàm findMany phải được gọi 3 lần
      expect(prisma.mockSession.findMany).toHaveBeenCalledTimes(3);

      // Hàm updateMany phải được gọi 2 lần với các danh sách ID tương ứng
      expect(prisma.mockSession.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.mockSession.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: { in: batch1.map((s) => s.id) } },
        data: { status: SessionStatus.COMPLETED },
      });
      expect(prisma.mockSession.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: { in: batch2.map((s) => s.id) } },
        data: { status: SessionStatus.COMPLETED },
      });

      // Hàm schedule chỉ được gọi 1 lần duy nhất vào cuối Cronjob
      // expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleSessionEnd', () => {
    it('adds a delayed end-session job when no job exists yet', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      sessionQueue.getJob.mockResolvedValue(null);

      await service.scheduleSessionEnd(
        {
          id: 20,
          scheduledAt: new Date('2026-01-01T00:05:00.000Z'),
          durationMinutes: 10,
        },
        [1, 2],
      );

      expect(sessionQueue.getJob).toHaveBeenCalledWith('session-20');
      expect(sessionQueue.add).toHaveBeenCalledWith(
        'end-session',
        { sessionId: 20, userIds: [1, 2] },
        { delay: 900000, jobId: 'session-20' },
      );
    });

    it('does not add a duplicate or already-ended job', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
      sessionQueue.getJob.mockResolvedValue({ id: 'session-21' });

      await service.scheduleSessionEnd(
        {
          id: 21,
          scheduledAt: new Date('2026-01-01T01:05:00.000Z'),
          durationMinutes: 10,
        },
        [1],
      );
      await service.scheduleSessionEnd(
        {
          id: 22,
          scheduledAt: new Date('2026-01-01T00:00:00.000Z'),
          durationMinutes: 10,
        },
        [1],
      );

      expect(sessionQueue.getJob).toHaveBeenCalledTimes(2);
      expect(sessionQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('scheduleSessionStartNotification', () => {
    it('queues the meeting-room notification at the scheduled start time', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      sessionQueue.getJob.mockResolvedValue(null);

      await service.scheduleSessionStartNotification(
        {
          id: 20,
          scheduledAt: new Date('2026-01-01T00:05:00.000Z'),
          meetingLink: '/interview/mentor-booking-20?sessionId=20',
        },
        [1, 2],
      );

      expect(sessionQueue.add).toHaveBeenCalledWith(
        'start-session-notification',
        {
          sessionId: 20,
          userIds: [1, 2],
          meetingLink: '/interview/mentor-booking-20?sessionId=20',
        },
        { delay: 300000, jobId: 'session-start-20' },
      );
    });
  });

  describe('getSessions', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-03T10:00:00.000Z'));
      prisma.mockSession.findMany.mockReset();
      prisma.mockSession.count.mockReset();
      prisma.booking.findMany.mockReset();
      prisma.booking.count.mockReset();
    });
    it('combines and maps all session types for the ALL tab', async () => {
      const upcoming = {
        id: 1,
        status: SessionStatus.SCHEDULED,
        scheduledAt: new Date('2026-01-05T10:00:00.000Z'),
        meetingLink: 'https://meet/upcoming',
        booking: {
          mentorId: 10,
          candidateId: 20,
          createdAt: new Date('2026-01-04T10:00:00.000Z'),
          mentor: { id: 10, name: 'Mentor', avatarUrl: null },
          candidate: { id: 20, name: 'Candidate', avatarUrl: null },
          coachingPlan: { title: 'Mock Interview' },
        },
        match: null,
      };
      const finished = {
        id: 4,
        status: SessionStatus.COMPLETED,
        scheduledAt: new Date('2026-01-01T10:00:00.000Z'),
        meetingLink: null,
        recordingUrl: '/recordings/4',
        booking: null,
        match: {
          candidateAId: 10,
          createdAt: new Date('2026-01-01T09:00:00.000Z'),
          candidateA: { id: 10, name: 'Me', avatarUrl: null },
          candidateB: { id: 30, name: 'Peer', avatarUrl: '/peer.png' },
        },
        feedbacks: [{ id: 1 }],
      };
      const pending = {
        id: 2,
        mentorId: 10,
        status: BookingStatus.PENDING_ACCEPTANCE,
        createdAt: new Date('2026-01-03T10:00:00.000Z'),
        startTime: new Date('2026-01-06T10:00:00.000Z'),
        mentor: { id: 10, name: 'Mentor', avatarUrl: null },
        candidate: { id: 21, name: 'Pending Candidate', avatarUrl: null },
        coachingPlan: { title: 'Pending Plan' },
      };
      const rejected = {
        id: 3,
        mentorId: 10,
        status: BookingStatus.REJECTED,
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
        startTime: new Date('2026-01-07T10:00:00.000Z'),
        mentor: { id: 10, name: 'Mentor', avatarUrl: null },
        candidate: { id: 22, name: 'Rejected Candidate', avatarUrl: null },
        coachingPlan: null,
        logs: [{ action: 'REJECT', note: 'Unavailable' }],
      };

      prisma.mockSession.findMany
        .mockResolvedValueOnce([upcoming, finished])
        .mockResolvedValueOnce([upcoming, finished]);
      prisma.booking.findMany
        .mockResolvedValueOnce([pending, rejected])
        .mockResolvedValueOnce([pending, rejected]);
      prisma.booking.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await service.getSessions(10, {
        tab: SessionTab.ALL,
        page: 1,
        limit: 10,
      } as GetSessionsDto);

      expect(result.items.map((item) => item.status)).toEqual([
        'UPCOMING',
        'PENDING',
        'REJECTED',
        'FINISHED',
      ]);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          type: 'MENTOR',
          opponentName: 'Candidate',
          coachingPlan: 'Mock Interview',
        }),
      );
      expect(result.items[2].rejectedReason).toBe('Unavailable');
      expect(result.items[3]).toEqual(
        expect.objectContaining({
          type: 'P2P',
          opponentName: 'Peer',
          recordingUrl: '/recordings/4',
          hasFeedback: true,
        }),
      );
      expect(result.meta).toEqual({
        total: 4,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('applies search and date filters for upcoming sessions', async () => {
      prisma.mockSession.findMany.mockResolvedValue([]);
      prisma.mockSession.count.mockResolvedValue(0);
      const expectedEndDate = new Date('2026-01-31');
      expectedEndDate.setHours(23, 59, 59, 999);

      const result = await service.getSessions(7, {
        tab: SessionTab.UPCOMING,
        search: 'typescript',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(prisma.mockSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SessionStatus.SCHEDULED,
            scheduledAt: {
              gte: new Date('2026-01-01'),
              lte: expectedEndDate,
            },
            OR: expect.arrayContaining([
              { intervieweeId: 7 },
              { booking: { mentorId: 7 } },
            ]),
            AND: [
              {
                OR: expect.arrayContaining([
                  {
                    interviewee: {
                      name: { contains: 'typescript', mode: 'insensitive' },
                    },
                  },
                ]),
              },
            ],
          }),
        }),
      );
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('handles individual tabs and alternate session mapper branches', async () => {
      const createdAt = new Date('2026-01-01T09:00:00.000Z');
      const scheduledAt = new Date('2026-01-05T10:00:00.000Z');

      prisma.mockSession.findMany.mockResolvedValueOnce([
        {
          id: 10,
          scheduledAt,
          durationMinutes: 60,
          status: SessionStatus.SCHEDULED,
          meetingLink: null,
          booking: null,
          match: {
            candidateAId: 7,
            createdAt,
            candidateA: { id: 7, name: 'Me', avatarUrl: null },
            candidateB: { id: 8, name: 'Partner', avatarUrl: '/p.png' },
          },
        },
        {
          id: 11,
          scheduledAt: new Date('2026-01-06T10:00:00.000Z'),
          durationMinutes: 60,
          status: SessionStatus.SCHEDULED,
          meetingLink: null,
          booking: null,
          match: null,
        },
      ]);
      prisma.mockSession.count.mockResolvedValueOnce(2);
      const upcoming = await service.getSessions(7, {
        tab: SessionTab.UPCOMING,
      });
      expect(upcoming.items[0]).toEqual(
        expect.objectContaining({ type: 'P2P', opponentName: 'Partner' }),
      );
      expect(upcoming.items[1]).toEqual(
        expect.objectContaining({ type: 'SOLO', opponentName: 'Unknown' }),
      );

      prisma.booking.findMany.mockResolvedValueOnce([
        {
          id: 20,
          mentorId: 2,
          candidateId: 7,
          createdAt,
          startTime: null,
          mentor: { id: 2, name: 'Mentor', avatarUrl: null },
          candidate: { id: 7, name: 'Me', avatarUrl: null },
          coachingPlan: null,
        },
      ]);
      prisma.booking.count.mockResolvedValueOnce(1);
      const pending = await service.getSessions(7, { tab: SessionTab.PENDING });
      expect(pending.items[0]).toEqual(
        expect.objectContaining({
          status: 'PENDING',
          opponentName: 'Mentor',
          coachingPlan: null,
        }),
      );
    });
  });

  describe('cancelSession', () => {
    it('cancels a booking and its linked mock sessions', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 31,
        status: BookingStatus.ACCEPTED,
        mockSessions: [{ id: 50 }],
      });
      prisma.mockSession.findFirst.mockResolvedValue(null);

      const result = await service.cancelSession(10, 31, 'Cannot attend');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 31 },
        data: {
          status: BookingStatus.CANCELLED,
          logs: {
            create: {
              actorId: 10,
              action: 'CANCEL_BOOKING',
              note: 'Cannot attend',
              statusBefore: BookingStatus.ACCEPTED,
              statusAfter: BookingStatus.CANCELLED,
            },
          },
        },
      });
      expect(prisma.mockSession.updateMany).toHaveBeenCalledWith({
        where: { bookingId: 31 },
        data: { status: SessionStatus.CANCELLED },
      });
      expect(sessionQueue.remove).toHaveBeenCalledWith('session-31');
      expect(result.success).toBe(true);
    });

    it('cancels a standalone mock session', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.mockSession.findFirst.mockResolvedValue({ id: 41 });

      await service.cancelSession(10, 41, 'Stop');

      expect(prisma.mockSession.update).toHaveBeenCalledWith({
        where: { id: 41 },
        data: { status: SessionStatus.CANCELLED },
      });
      expect(prisma.booking.update).not.toHaveBeenCalled();
      expect(sessionQueue.remove).toHaveBeenCalledWith('session-41');
    });

    it('cancels a booking without linked mock sessions', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 32,
        status: BookingStatus.PENDING_ACCEPTANCE,
        mockSessions: [],
      });
      prisma.mockSession.findFirst.mockResolvedValue(null);

      await service.cancelSession(10, 32, 'Cancel booking');

      expect(prisma.booking.update).toHaveBeenCalled();
      expect(prisma.mockSession.updateMany).not.toHaveBeenCalled();
      expect(sessionQueue.remove).toHaveBeenCalledWith('session-32');
    });

    it('throws when the user has no cancellable session', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.mockSession.findFirst.mockResolvedValue(null);

      // The method throws an error, we just verify queue.remove is not called
      await expect(service.cancelSession(10, 999, 'Stop')).rejects.toThrow();
      // Vì throw error nên queue không được gỡ
      expect(sessionQueue.remove).not.toHaveBeenCalled();
    });
  });
});
