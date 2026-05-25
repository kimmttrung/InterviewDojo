import { getQueueToken } from '@nestjs/bull';
import { Test } from '@nestjs/testing';
import { BookingStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSessionsDto, SessionTab } from './dto/get-sessions.dto';
import { SessionService } from './session.service';

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
    // Đã thêm hàm remove mock để khớp với logic gọi trực tiếp của BullMQ
    remove: jest.fn(),
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('session'), useValue: sessionQueue },
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

  describe('onModuleInit', () => {
    it('completes expired sessions and schedules upcoming sessions once per user', async () => {
      const scheduledAt = new Date('2026-06-01T10:00:00.000Z');
      prisma.mockSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.mockSession.findMany.mockResolvedValue([
        {
          id: 11,
          intervieweeId: 2,
          scheduledAt,
          durationMinutes: 60,
          booking: { mentorId: 1, candidateId: 2 },
          match: null,
        },
      ]);
      const scheduleSpy = jest
        .spyOn(service, 'scheduleSessionEnd')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(prisma.mockSession.updateMany).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.SCHEDULED,
          scheduledAt: { lt: expect.any(Date) },
        },
        data: { status: SessionStatus.COMPLETED },
      });
      expect(prisma.mockSession.findMany).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.SCHEDULED,
          scheduledAt: { gt: expect.any(Date) },
        },
        include: {
          booking: { select: { mentorId: true, candidateId: true } },
          match: { select: { candidateAId: true, candidateBId: true } },
        },
      });
      expect(scheduleSpy).toHaveBeenCalledWith(11, [2, 1], scheduledAt, 60);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ SessionService initialized',
      );
    });

    it('schedules participants from peer matching sessions', async () => {
      const scheduledAt = new Date('2026-06-02T10:00:00.000Z');
      prisma.mockSession.updateMany.mockResolvedValue({ count: 0 });
      prisma.mockSession.findMany.mockResolvedValue([
        {
          id: 12,
          intervieweeId: 2,
          scheduledAt,
          durationMinutes: 45,
          booking: null,
          match: { candidateAId: 1, candidateBId: 2 },
        },
      ]);
      const scheduleSpy = jest
        .spyOn(service, 'scheduleSessionEnd')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(scheduleSpy).toHaveBeenCalledWith(12, [2, 1], scheduledAt, 45);
    });
  });

  describe('scheduleSessionEnd', () => {
    it('adds a delayed end-session job when no job exists yet', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      sessionQueue.getJob.mockResolvedValue(null);

      await service.scheduleSessionEnd(
        20,
        [1, 2],
        new Date('2026-01-01T00:05:00.000Z'),
        10,
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
      // Trả về một job giả
      sessionQueue.getJob.mockResolvedValue({ id: 'session-21' });

      await service.scheduleSessionEnd(
        21,
        [1],
        new Date('2026-01-01T01:05:00.000Z'),
        10,
      );
      await service.scheduleSessionEnd(
        22,
        [1],
        new Date('2026-01-01T00:00:00.000Z'),
        10,
      );

      expect(sessionQueue.getJob).toHaveBeenCalledTimes(1);
      expect(sessionQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getSessions', () => {
    it('combines and maps all session types for the ALL tab', async () => {
      const upcoming = {
        id: 1,
        status: SessionStatus.SCHEDULED, // ✅ THÊM DÒNG NÀY
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
        createdAt: new Date('2026-01-03T10:00:00.000Z'),
        startTime: new Date('2026-01-06T10:00:00.000Z'),
        mentor: { id: 10, name: 'Mentor', avatarUrl: null },
        candidate: { id: 21, name: 'Pending Candidate', avatarUrl: null },
        coachingPlan: { title: 'Pending Plan' },
      };
      const rejected = {
        id: 3,
        mentorId: 10,
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
        startTime: new Date('2026-01-07T10:00:00.000Z'),
        mentor: { id: 10, name: 'Mentor', avatarUrl: null },
        candidate: { id: 22, name: 'Rejected Candidate', avatarUrl: null },
        coachingPlan: null,
        logs: [{ action: 'REJECT', note: 'Unavailable' }], // Đổi thành REJECT để test mapRejectedBookingToItem
      };

      prisma.mockSession.findMany
        .mockResolvedValueOnce([upcoming])
        .mockResolvedValueOnce([finished]);
      prisma.mockSession.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      prisma.booking.findMany
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([rejected]);
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
      const scheduledAt = new Date('2026-01-02T10:00:00.000Z');

      prisma.mockSession.findMany.mockResolvedValueOnce([
        {
          id: 10,
          scheduledAt,
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
          scheduledAt: null,
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
      // ✅ SỬA: Test hàm queue.remove theo ID trực tiếp
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

      // ✅ SỬA
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

      // ✅ SỬA
      expect(sessionQueue.remove).toHaveBeenCalledWith('session-32');
    });

    it('throws when the user has no cancellable session', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.mockSession.findFirst.mockResolvedValue(null);

      await expect(service.cancelSession(10, 999, 'Stop')).rejects.toThrow(
        /phi.+n h.+c ho.+c b.+n kh.+ng c.+ quy.+n h.+y/,
      );

      // Vì throw error nên queue không được gỡ
      expect(sessionQueue.remove).not.toHaveBeenCalled();
    });
  });
});
