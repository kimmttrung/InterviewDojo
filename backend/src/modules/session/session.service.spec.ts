import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookingStatus, SessionSource, SessionStatus } from '@prisma/client';
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
      findUnique: jest.fn(),
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

    it('logs cron errors without throwing', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation();
      prisma.mockSession.findMany.mockRejectedValueOnce(new Error('db down'));

      await expect(service.handleOverdueSessions()).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Lỗi khi chạy Cron Job quét session quá hạn:',
        expect.any(Error),
      );
    });

    it('uses default duration while checking overdue sessions', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-01T02:00:00.000Z'));
      prisma.mockSession.findMany
        .mockResolvedValueOnce([
          {
            id: 200,
            scheduledAt: new Date('2026-05-01T00:30:00.000Z'),
            durationMinutes: null,
          },
        ])
        .mockResolvedValueOnce([]);
      prisma.mockSession.updateMany.mockResolvedValue({ count: 1 });

      await service.handleOverdueSessions();

      expect(prisma.mockSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [200] } },
        data: { status: SessionStatus.COMPLETED },
      });
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

  describe('scheduleAllUpcomingSessions', () => {
    it('bulk schedules upcoming booking, match and solo sessions', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      prisma.mockSession.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            intervieweeId: 100,
            scheduledAt: new Date('2026-01-01T01:00:00.000Z'),
            durationMinutes: 60,
            source: SessionSource.MENTOR_BOOKING,
            meetingLink: '/meeting/1',
            booking: { mentorId: 2, candidateId: 1 },
            match: null,
          },
          {
            id: 2,
            intervieweeId: 3,
            scheduledAt: new Date('2026-01-01T02:00:00.000Z'),
            durationMinutes: 30,
            source: SessionSource.P2P_MATCH,
            meetingLink: null,
            booking: null,
            match: { candidateAId: 3, candidateBId: 4 },
          },
          {
            id: 3,
            intervieweeId: 5,
            scheduledAt: new Date('2026-01-01T03:00:00.000Z'),
            durationMinutes: 45,
            source: SessionSource.SOLO,
            meetingLink: null,
            booking: null,
            match: null,
          },
        ])
        .mockResolvedValueOnce([]);

      await service.scheduleAllUpcomingSessions();

      expect(sessionQueue.addBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'end-session',
            data: { sessionId: 1, userIds: [100, 2, 1] },
            opts: expect.objectContaining({ jobId: 'session-1' }),
          }),
          expect.objectContaining({
            name: 'start-session-notification',
            data: {
              sessionId: 1,
              userIds: [100, 2, 1],
              meetingLink: '/meeting/1',
            },
            opts: expect.objectContaining({ jobId: 'session-start-1' }),
          }),
          expect.objectContaining({
            name: 'end-session',
            data: { sessionId: 2, userIds: [3, 4] },
          }),
          expect.objectContaining({
            name: 'end-session',
            data: { sessionId: 3, userIds: [5] },
          }),
        ]),
      );
    });

    it('does not enqueue jobs for sessions that already ended before boot scheduling', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T02:00:00.000Z'));
      prisma.mockSession.findMany
        .mockResolvedValueOnce([
          {
            id: 4,
            intervieweeId: 5,
            scheduledAt: new Date('2026-01-01T00:00:00.000Z'),
            durationMinutes: 30,
            source: SessionSource.SOLO,
            meetingLink: null,
            booking: null,
            match: null,
          },
        ])
        .mockResolvedValueOnce([]);

      await service.scheduleAllUpcomingSessions();

      expect(sessionQueue.addBulk).not.toHaveBeenCalled();
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

    it('handles ALL tab pages with only bookings or only mock sessions', async () => {
      const createdAt = new Date('2026-01-03T10:00:00.000Z');
      const scheduledAt = new Date('2026-01-04T10:00:00.000Z');

      prisma.mockSession.findMany.mockResolvedValueOnce([]);
      prisma.booking.findMany
        .mockResolvedValueOnce([
          {
            id: 300,
            status: BookingStatus.PENDING_ACCEPTANCE,
            createdAt,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 300,
            mentorId: 7,
            candidateId: 8,
            durationMinutes: 60,
            createdAt,
            startTime: scheduledAt,
            mentor: { id: 7, name: 'Mentor', avatarUrl: null },
            candidate: { id: 8, name: 'Candidate', avatarUrl: null },
            coachingPlan: null,
          },
        ]);

      const onlyBookings = await service.getSessions(7, {
        tab: SessionTab.ALL,
      });
      expect(onlyBookings.items[0]).toEqual(
        expect.objectContaining({ id: 300, status: 'PENDING' }),
      );

      prisma.mockSession.findMany
        .mockResolvedValueOnce([
          {
            id: 301,
            status: SessionStatus.SCHEDULED,
            scheduledAt: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 301,
            status: SessionStatus.SCHEDULED,
            scheduledAt,
            durationMinutes: 60,
            meetingLink: null,
            booking: null,
            match: null,
          },
        ]);
      prisma.booking.findMany.mockResolvedValueOnce([]);

      const onlyMocks = await service.getSessions(7, { tab: SessionTab.ALL });
      expect(onlyMocks.items[0]).toEqual(
        expect.objectContaining({ id: 301, status: 'UPCOMING' }),
      );
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

    it('maps ongoing and overdue scheduled sessions in the upcoming tab', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-03T10:00:00.000Z'));
      prisma.mockSession.findMany.mockResolvedValueOnce([
        {
          id: 90,
          scheduledAt: new Date('2026-01-03T09:30:00.000Z'),
          durationMinutes: 60,
          status: SessionStatus.SCHEDULED,
          meetingLink: '/meeting/90',
          booking: null,
          match: null,
        },
        {
          id: 91,
          scheduledAt: new Date('2026-01-03T08:00:00.000Z'),
          durationMinutes: 30,
          status: SessionStatus.SCHEDULED,
          meetingLink: null,
          booking: null,
          match: null,
        },
      ]);
      prisma.mockSession.count.mockResolvedValueOnce(2);

      const result = await service.getSessions(7, { tab: SessionTab.UPCOMING });

      expect(result.items.map((item) => item.status)).toEqual([
        'ONGOING',
        'FINISHED',
      ]);
    });

    it('filters sessions by source type, statuses, search and dates', async () => {
      const scheduledAt = new Date('2026-01-02T10:00:00.000Z');
      prisma.mockSession.findMany.mockResolvedValue([
        {
          id: 70,
          scheduledAt,
          durationMinutes: 60,
          status: SessionStatus.COMPLETED,
          meetingLink: '/meeting/70',
          booking: {
            mentorId: 7,
            candidateId: 8,
            createdAt: scheduledAt,
            mentor: { id: 7, name: 'Me', avatarUrl: null },
            candidate: { id: 8, name: 'Candidate', avatarUrl: null },
            coachingPlan: { title: 'Backend' },
          },
          match: null,
          feedbacks: [{ id: 1 }],
        },
      ]);
      prisma.mockSession.count.mockResolvedValue(1);

      const result = await service.getSessions(7, {
        type: SessionSource.MENTOR_BOOKING,
        statuses: [SessionStatus.COMPLETED],
        search: 'backend',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      } as any);

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          type: 'MENTOR',
          opponentName: 'Candidate',
          status: 'FINISHED',
        }),
      );
      expect(prisma.mockSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: SessionSource.MENTOR_BOOKING,
            status: { in: [SessionStatus.COMPLETED] },
            AND: expect.any(Array),
            scheduledAt: expect.objectContaining({
              gte: new Date('2026-01-01'),
            }),
          }),
        }),
      );
    });

    it('filters sessions by a single source status and returns totalPages fallback', async () => {
      prisma.mockSession.findMany.mockResolvedValue([]);
      prisma.mockSession.count.mockResolvedValue(0);

      const result = await service.getSessions(7, {
        type: SessionSource.SOLO,
        statuses: SessionStatus.SCHEDULED,
      } as any);

      expect(prisma.mockSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [SessionStatus.SCHEDULED] },
          }),
        }),
      );
      expect(result.meta.totalPages).toBe(1);
    });

    it('maps rejected and finished tabs with fallback values', async () => {
      const createdAt = new Date('2026-01-01T09:00:00.000Z');
      prisma.booking.findMany.mockResolvedValueOnce([
        {
          id: 80,
          mentorId: 7,
          candidateId: 8,
          durationMinutes: 60,
          createdAt,
          startTime: null,
          mentor: null,
          candidate: null,
          coachingPlan: null,
          logs: [],
        },
      ]);
      prisma.booking.count.mockResolvedValueOnce(1);

      const rejected = await service.getSessions(7, {
        tab: SessionTab.REJECTED,
      });
      expect(rejected.items[0]).toEqual(
        expect.objectContaining({
          status: 'REJECTED',
          opponentName: 'Unknown',
          rejectedReason: null,
          scheduledAt: null,
        }),
      );

      prisma.mockSession.findMany.mockResolvedValueOnce([
        {
          id: 81,
          scheduledAt: null,
          durationMinutes: 30,
          status: SessionStatus.COMPLETED,
          meetingLink: null,
          recordingUrl: null,
          booking: null,
          match: null,
          feedbacks: [],
        },
      ]);
      prisma.mockSession.count.mockResolvedValueOnce(1);

      const finished = await service.getSessions(7, {
        tab: SessionTab.FINISHED,
      });
      expect(finished.items[0]).toEqual(
        expect.objectContaining({
          type: 'SOLO',
          opponentName: 'Unknown',
          scheduledAt: null,
          hasFeedback: false,
        }),
      );
    });

    it('maps finished mentor booking sessions for both mentor and candidate perspectives', async () => {
      const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
      const createdAt = new Date('2026-01-01T09:00:00.000Z');
      prisma.mockSession.findMany
        .mockResolvedValueOnce([
          {
            id: 92,
            scheduledAt,
            durationMinutes: 60,
            status: SessionStatus.COMPLETED,
            meetingLink: '/meeting/92',
            recordingUrl: '/recording/92',
            booking: {
              mentorId: 7,
              candidateId: 8,
              createdAt,
              mentor: { id: 7, name: 'Mentor', avatarUrl: null },
              candidate: { id: 8, name: 'Candidate', avatarUrl: '/c.png' },
              coachingPlan: { title: 'Backend' },
            },
            match: null,
            feedbacks: [{ id: 1 }],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 93,
            scheduledAt,
            durationMinutes: 60,
            status: SessionStatus.COMPLETED,
            meetingLink: null,
            recordingUrl: null,
            booking: {
              mentorId: 7,
              candidateId: 8,
              createdAt,
              mentor: { id: 7, name: 'Mentor', avatarUrl: null },
              candidate: { id: 8, name: 'Candidate', avatarUrl: '/c.png' },
              coachingPlan: null,
            },
            match: null,
            feedbacks: [],
          },
        ]);
      prisma.mockSession.count.mockResolvedValue(1);

      const mentorView = await service.getSessions(7, {
        tab: SessionTab.FINISHED,
      });
      const candidateView = await service.getSessions(8, {
        tab: SessionTab.FINISHED,
      });

      expect(mentorView.items[0]).toEqual(
        expect.objectContaining({
          type: 'MENTOR',
          opponentName: 'Candidate',
          coachingPlan: 'Backend',
          hasFeedback: true,
        }),
      );
      expect(candidateView.items[0]).toEqual(
        expect.objectContaining({
          type: 'MENTOR',
          opponentName: 'Mentor',
          coachingPlan: null,
          hasFeedback: false,
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

    it('cancels a booking-backed mock session and notifies all participants', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.mockSession.findFirst.mockResolvedValue({
        id: 42,
        intervieweeId: 99,
        booking: { mentorId: 10, candidateId: 11 },
        match: null,
      });

      await service.cancelSession(10, 42, 'Stop');

      expect(mockSocketService.emitToUser).toHaveBeenCalledWith(
        99,
        'SESSION_CANCELED',
        { sessionId: 42, reason: 'Stop' },
      );
      expect(mockSocketService.emitToUser).toHaveBeenCalledWith(
        10,
        'SESSION_CANCELED',
        { sessionId: 42, reason: 'Stop' },
      );
      expect(mockSocketService.emitToUser).toHaveBeenCalledWith(
        11,
        'SESSION_CANCELED',
        { sessionId: 42, reason: 'Stop' },
      );
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

  describe('getSessionDetail', () => {
    it('returns session detail with upcoming, ongoing, finished and completed display statuses', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
      prisma.mockSession.findUnique
        .mockResolvedValueOnce({
          id: 1,
          source: SessionSource.MENTOR_BOOKING,
          status: SessionStatus.SCHEDULED,
          scheduledAt: new Date('2026-01-01T10:30:00.000Z'),
          durationMinutes: 60,
          intervieweeId: 99,
          booking: { mentorId: 7, candidateId: 8 },
          match: null,
        })
        .mockResolvedValueOnce({
          id: 2,
          source: SessionSource.MENTOR_BOOKING,
          status: SessionStatus.SCHEDULED,
          scheduledAt: new Date('2026-01-01T10:10:00.000Z'),
          durationMinutes: 60,
          intervieweeId: 99,
          booking: { mentorId: 7, candidateId: 8 },
          match: null,
        })
        .mockResolvedValueOnce({
          id: 3,
          source: SessionSource.SOLO,
          status: SessionStatus.SCHEDULED,
          scheduledAt: new Date('2026-01-01T08:00:00.000Z'),
          durationMinutes: null,
          intervieweeId: 7,
          booking: null,
          match: null,
        })
        .mockResolvedValueOnce({
          id: 4,
          source: SessionSource.P2P_MATCH,
          status: SessionStatus.COMPLETED,
          scheduledAt: new Date('2026-01-01T08:00:00.000Z'),
          durationMinutes: 60,
          intervieweeId: 99,
          booking: null,
          match: { candidateAId: 7, candidateBId: 8 },
        });

      await expect(service.getSessionDetail(1, 7)).resolves.toEqual(
        expect.objectContaining({ status: 'UPCOMING', mentorId: 7 }),
      );
      await expect(service.getSessionDetail(2, 8)).resolves.toEqual(
        expect.objectContaining({ status: 'ONGOING', candidateId: 8 }),
      );
      await expect(service.getSessionDetail(3, 7)).resolves.toEqual(
        expect.objectContaining({ status: 'FINISHED', intervieweeId: 7 }),
      );
      await expect(service.getSessionDetail(4, 8)).resolves.toEqual(
        expect.objectContaining({ status: 'FINISHED' }),
      );
    });

    it('rejects missing session detail and non-participants', async () => {
      prisma.mockSession.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 5,
          source: SessionSource.SOLO,
          status: SessionStatus.SCHEDULED,
          scheduledAt: new Date(),
          durationMinutes: 60,
          intervieweeId: 1,
          booking: null,
          match: null,
        });

      await expect(service.getSessionDetail(404, 7)).rejects.toThrow(
        'Session not found',
      );
      await expect(service.getSessionDetail(5, 7)).rejects.toThrow(
        'Not participant',
      );
    });
  });

  describe('getOrCreateMeetingLink', () => {
    it('returns an existing meeting link for a participant in the join window', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 1,
        bookingId: 22,
        matchId: null,
        intervieweeId: 99,
        scheduledAt: new Date('2026-01-01T10:10:00.000Z'),
        durationMinutes: 60,
        meetingLink: '/existing',
        booking: {
          mentorId: 7,
          candidateId: 8,
          mentor: {},
          candidate: {},
        },
        match: null,
      });

      await expect(service.getOrCreateMeetingLink(1, 7)).resolves.toBe(
        '/existing',
      );
      expect(mockStreamService.getOrCreateMeetingLink).not.toHaveBeenCalled();
    });

    it('creates and stores a meeting link when none exists', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 2,
        bookingId: null,
        matchId: 33,
        intervieweeId: 99,
        scheduledAt: new Date('2026-01-01T10:00:00.000Z'),
        durationMinutes: 60,
        meetingLink: null,
        booking: null,
        match: { candidateAId: 7, candidateBId: 8 },
      });

      await expect(service.getOrCreateMeetingLink(2, 8)).resolves.toBe(
        '/meeting/room',
      );
      expect(mockStreamService.getOrCreateMeetingLink).toHaveBeenCalledWith(
        '2',
        '8',
      );
      expect(prisma.mockSession.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { meetingLink: '/meeting/room' },
      });
    });

    it('rejects invalid meeting-link access states', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
      prisma.mockSession.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 3,
          bookingId: null,
          matchId: null,
          intervieweeId: 7,
          scheduledAt: new Date('2026-01-01T10:00:00.000Z'),
          durationMinutes: 60,
          meetingLink: null,
          booking: null,
          match: null,
        })
        .mockResolvedValueOnce({
          id: 4,
          bookingId: null,
          matchId: null,
          intervieweeId: 1,
          scheduledAt: new Date('2026-01-01T10:00:00.000Z'),
          durationMinutes: 60,
          meetingLink: null,
          booking: null,
          match: null,
        })
        .mockResolvedValueOnce({
          id: 5,
          bookingId: null,
          matchId: null,
          intervieweeId: 7,
          scheduledAt: new Date('2026-01-01T11:00:00.000Z'),
          durationMinutes: 60,
          meetingLink: null,
          booking: null,
          match: null,
        })
        .mockResolvedValueOnce({
          id: 6,
          bookingId: null,
          matchId: null,
          intervieweeId: 7,
          scheduledAt: new Date('2026-01-01T08:00:00.000Z'),
          durationMinutes: 60,
          meetingLink: null,
          booking: null,
          match: null,
        });

      await expect(service.getOrCreateMeetingLink(404, 7)).rejects.toThrow(
        'Session không tồn tại',
      );
      await expect(
        service.getOrCreateMeetingLink(3, Number.NaN),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.getOrCreateMeetingLink(4, 7)).rejects.toThrow(
        'Bạn không có quyền tham gia session này',
      );
      await expect(service.getOrCreateMeetingLink(5, 7)).rejects.toThrow(
        'Chưa đến giờ phỏng vấn',
      );
      await expect(service.getOrCreateMeetingLink(6, 7)).rejects.toThrow(
        'Cuộc phỏng vấn đã kết thúc',
      );
    });
  });

  describe('private mapper fallback coverage', () => {
    it('maps mock session fallback branches directly', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-03T10:00:00.000Z'));

      const bookingItem = (service as any).mapMockSessionToItem(
        {
          id: 100,
          scheduledAt: null,
          durationMinutes: 60,
          status: SessionStatus.COMPLETED,
          meetingLink: '',
          booking: {
            mentorId: 7,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            mentor: { id: 7, name: 'Mentor', avatarUrl: null },
            candidate: null,
            coachingPlan: null,
          },
          match: null,
        },
        7,
      );

      expect(bookingItem).toEqual(
        expect.objectContaining({
          type: 'MENTOR',
          opponentName: 'Unknown',
          coachingPlan: null,
          scheduledAt: null,
          meetingLink: null,
        }),
      );

      const matchItem = (service as any).mapMockSessionToItem(
        {
          id: 101,
          scheduledAt: new Date('2026-01-04T10:00:00.000Z'),
          durationMinutes: 60,
          status: SessionStatus.SCHEDULED,
          meetingLink: null,
          booking: null,
          match: {
            candidateAId: 8,
            candidateA: { id: 8, name: 'A', avatarUrl: null },
            candidateB: { id: 7, name: 'B', avatarUrl: null },
            createdAt: null,
          },
        },
        7,
      );

      expect(matchItem).toEqual(
        expect.objectContaining({
          type: 'P2P',
          opponentName: 'A',
          createdAt: undefined,
        }),
      );
    });

    it('maps booking and finished session fallback branches directly', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const pending = (service as any).mapBookingToItem(
        {
          id: 110,
          mentorId: 7,
          durationMinutes: 60,
          mentor: null,
          candidate: null,
          coachingPlan: null,
          startTime: null,
          createdAt,
        },
        7,
      );
      expect(pending).toEqual(
        expect.objectContaining({
          opponentId: null,
          opponentName: 'Unknown',
          scheduledAt: null,
        }),
      );

      const rejected = (service as any).mapRejectedBookingToItem(
        {
          id: 111,
          mentorId: 8,
          durationMinutes: 60,
          mentor: { id: 8, name: 'Mentor', avatarUrl: null },
          candidate: null,
          coachingPlan: null,
          startTime: null,
          createdAt,
          logs: null,
        },
        7,
      );
      expect(rejected).toEqual(
        expect.objectContaining({
          opponentName: 'Mentor',
          rejectedReason: null,
        }),
      );

      const finishedMatch = (service as any).mapFinishedSessionToItem(
        {
          id: 112,
          scheduledAt: null,
          durationMinutes: 60,
          meetingLink: '',
          recordingUrl: '',
          booking: null,
          match: {
            candidateAId: 8,
            candidateA: { id: 8, name: 'A', avatarUrl: null },
            candidateB: { id: 7, name: 'B', avatarUrl: null },
            createdAt: null,
          },
          feedbacks: null,
        },
        7,
      );
      expect(finishedMatch).toEqual(
        expect.objectContaining({
          type: 'P2P',
          opponentName: 'A',
          scheduledAt: null,
          meetingLink: null,
          recordingUrl: null,
          hasFeedback: null,
        }),
      );
    });

    it('builds end job config with default duration', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const config = (service as any).buildEndJobConfig(
        {
          id: 120,
          scheduledAt: new Date('2026-01-01T00:10:00.000Z'),
          durationMinutes: null,
        },
        [1],
      );

      expect(config).toEqual(
        expect.objectContaining({
          name: 'end-session',
          data: { sessionId: 120, userIds: [1] },
          opts: { delay: 4_200_000, jobId: 'session-120' },
        }),
      );
    });

    it('buildSearchCondition returns empty object for empty search', () => {
      expect((service as any).buildSearchCondition()).toEqual({});
    });
  });
});
