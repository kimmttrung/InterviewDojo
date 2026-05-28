import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { BulkJobOptions, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSessionsDto, SessionTab } from './dto/get-sessions.dto';
import {
  PaginatedResponse,
  SessionItem,
} from './interfaces/session.interfaces';
import {
  Prisma,
  SessionStatus,
  BookingStatus,
  SessionSource,
} from '@prisma/client';
import { SocketService } from '../socket/socket.service';
@Injectable()
export class SessionService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('session') private sessionQueue: Queue,
    private socketService: SocketService,
  ) {}

  onModuleInit() {
    setTimeout(() => {
      (async () => {
        try {
          await this.prisma.mockSession.updateMany({
            where: {
              status: SessionStatus.SCHEDULED,
              scheduledAt: { lt: new Date() },
            },
            data: { status: SessionStatus.COMPLETED },
          });
          await this.scheduleAllUpcomingSessions();
        } catch (error) {
          console.error('SessionService initialization failed:', error);
        }
      })();
    }, 3000);
  }

  private async scheduleAllUpcomingSessions() {
    const BATCH_SIZE = 10;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      // 1. Lấy dữ liệu theo Batch để tránh tràn RAM
      const upcomingSessions = await this.prisma.mockSession.findMany({
        where: {
          status: SessionStatus.SCHEDULED,
          scheduledAt: { gt: new Date() },
        },
        include: {
          booking: { select: { mentorId: true, candidateId: true } },
          match: { select: { candidateAId: true, candidateBId: true } },
        },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });

      if (upcomingSessions.length === 0) {
        hasMore = false;
        break;
      }

      const jobsToAdd: { name: string; data: any; opts?: BulkJobOptions }[] =
        [];

      for (const session of upcomingSessions) {
        const userIds: number[] = [session.intervieweeId];
        if (session.booking) {
          userIds.push(session.booking.mentorId, session.booking.candidateId);
        } else if (session.match) {
          userIds.push(session.match.candidateAId, session.match.candidateBId);
        }
        const uniqueUserIds = [...new Set(userIds)];

        // Chuẩn bị job End Session
        const durationMinutes = session.durationMinutes;
        const endTime = new Date(
          session.scheduledAt.getTime() + durationMinutes * 60 * 1000,
        );
        const endDelay = endTime.getTime() - Date.now();

        if (endDelay > 0) {
          // jobsToAdd.push({
          //   name: 'end-session',
          //   data: { sessionId: session.id, userIds: uniqueUserIds },
          //   opts: { delay: endDelay, jobId: `session-${session.id}` },
          // });
          jobsToAdd.push(this.buildEndJobConfig(session, uniqueUserIds));
        }

        // Chuẩn bị job Start Notification
        if (
          session.source === SessionSource.MENTOR_BOOKING &&
          session.meetingLink
        ) {
          // const startDelay = Math.max(
          //   session.scheduledAt.getTime() - Date.now(),
          //   0,
          // );
          // jobsToAdd.push({
          //   name: 'start-session-notification',
          //   data: {
          //     sessionId: session.id,
          //     userIds: uniqueUserIds,
          //     meetingLink: session.meetingLink,
          //   },
          //   opts: { delay: startDelay, jobId: `session-start-${session.id}` },
          // });
          jobsToAdd.push(this.buildStartJobConfig(session, uniqueUserIds));
        }
      }

      // 2. Dùng addBulk để đẩy toàn bộ Jobs vào Redis trong 1 lệnh
      if (jobsToAdd.length > 0) {
        await this.sessionQueue.addBulk(jobsToAdd);
        console.log(
          `✅ [Boot] Scheduled ${jobsToAdd.length} jobs for ${upcomingSessions.length} sessions.`,
        );
      }

      skip += BATCH_SIZE;
    }
  }

  async scheduleSessionStartNotification(session: any, userIds: number[]) {
    const config = this.buildStartJobConfig(session, userIds);
    await this.sessionQueue.add(config.name, config.data, config.opts);
  }

  async scheduleSessionEnd(session: any, userIds: number[]) {
    const config = this.buildEndJobConfig(session, userIds);
    const existingJob = await this.sessionQueue.getJob(config.opts.jobId);
    if (!existingJob) {
      await this.sessionQueue.add(config.name, config.data, config.opts);
    }
  }

  async getSessions(
    userId: number,
    query: GetSessionsDto,
  ): Promise<PaginatedResponse<SessionItem>> {
    const { page = 1, limit = 10, tab, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;
    const { type, ...rest } = query;
    if (type) {
      return this.getSessionsByType(userId, type, rest);
    }

    // Hàm helper xây dựng điều kiện tìm kiếm mở rộng (cho các bảng khác nhau)
    const buildSearchCondition = (searchTerm?: string) => {
      if (!searchTerm) return {};
      return {
        AND: [
          {
            OR: [
              {
                booking: {
                  coachingPlan: {
                    title: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
              },
              {
                booking: {
                  mentor: {
                    name: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
              },
              {
                booking: {
                  candidate: {
                    name: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
              },
              {
                match: {
                  candidateA: {
                    name: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
              },
              {
                match: {
                  candidateB: {
                    name: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
              },
              {
                interviewee: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              }, // solo
            ],
          },
        ],
      };
    };

    // Hàm helper lọc theo khoảng ngày (áp dụng cho scheduledAt hoặc createdAt)
    const buildDateCondition = (dateField: string) => {
      const condition: any = {};
      if (startDate) {
        condition[dateField] = { gte: new Date(startDate) };
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        condition[dateField] = { ...condition[dateField], lte: end };
      }
      return condition;
    };

    let items: SessionItem[] = [];
    let total = 0;

    const mockSessionBaseWhere: Prisma.MockSessionWhereInput = {
      OR: [
        { intervieweeId: userId },
        { booking: { mentorId: userId } },
        { match: { candidateAId: userId } },
        { match: { candidateBId: userId } },
      ],
      ...buildSearchCondition(search),
      ...buildDateCondition('scheduledAt'),
    };
    const bookingBaseWhere: Prisma.BookingWhereInput = {
      OR: [{ candidateId: userId }, { mentorId: userId }],
      ...buildSearchCondition(search),
      ...buildDateCondition('createdAt'),
    };

    if (tab === SessionTab.ALL) {
      // Bước 3.1: Chỉ lấy ID và Ngày tháng
      const [mockSessionIds, bookingIds] = await Promise.all([
        this.prisma.mockSession.findMany({
          where: {
            ...mockSessionBaseWhere,
            status: { in: [SessionStatus.SCHEDULED, SessionStatus.COMPLETED] },
          },
          select: { id: true, scheduledAt: true, status: true },
        }),
        this.prisma.booking.findMany({
          where: {
            ...bookingBaseWhere,
            status: {
              in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.REJECTED],
            },
          },
          select: { id: true, createdAt: true, status: true },
        }),
      ]);

      const combinedLight = [
        ...mockSessionIds.map((s) => ({
          type: 'mock',
          id: s.id,
          status: s.status,
          date: s.scheduledAt || new Date(),
        })),
        ...bookingIds.map((b) => ({
          type: 'booking',
          id: b.id,
          status: b.status,
          date: b.createdAt,
        })),
      ];

      combinedLight.sort((a, b) => b.date.getTime() - a.date.getTime());
      total = combinedLight.length;

      const pagedLight = combinedLight.slice(skip, skip + limit);

      const targetMockIds = pagedLight
        .filter((x) => x.type === 'mock')
        .map((x) => x.id);
      const targetBookingIds = pagedLight
        .filter((x) => x.type === 'booking')
        .map((x) => x.id);

      const [fullMockSessions, fullBookings] = await Promise.all([
        targetMockIds.length > 0
          ? this.prisma.mockSession.findMany({
              where: { id: { in: targetMockIds } },
              include: {
                booking: {
                  include: {
                    mentor: true,
                    candidate: true,
                    coachingPlan: true,
                  },
                },
                match: { include: { candidateA: true, candidateB: true } },
                feedbacks: { where: { revieweeId: userId } },
              },
            })
          : Promise.resolve([]),
        targetBookingIds.length > 0
          ? this.prisma.booking.findMany({
              where: { id: { in: targetBookingIds } },
              include: {
                mentor: true,
                candidate: true,
                coachingPlan: true,
                logs: true,
              },
            })
          : Promise.resolve([]),
      ]);

      const mappedMocks = fullMockSessions.map((s) =>
        s.status === SessionStatus.SCHEDULED
          ? this.mapMockSessionToItem(s, userId)
          : this.mapFinishedSessionToItem(s, userId),
      );

      const mappedBookings = fullBookings.map((b) =>
        b.status === BookingStatus.REJECTED
          ? this.mapRejectedBookingToItem(b, userId)
          : this.mapBookingToItem(b, userId),
      );

      const allMapped = [...mappedMocks, ...mappedBookings];

      items = pagedLight
        .map((lightItem) =>
          allMapped.find(
            (item) =>
              item.id === lightItem.id &&
              ((lightItem.type === 'booking' &&
                (item.status === 'PENDING' || item.status === 'REJECTED')) ||
                (lightItem.type === 'mock' &&
                  (item.status === 'UPCOMING' || item.status === 'FINISHED'))),
          ),
        )
        .filter(Boolean) as SessionItem[];
    } else if (tab === SessionTab.PENDING) {
      const where = {
        ...bookingBaseWhere,
        status: BookingStatus.PENDING_ACCEPTANCE,
      };
      const [data, count] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }, // <-- THÊM SKIP & TAKE
          include: { mentor: true, candidate: true, coachingPlan: true },
        }),
        this.prisma.booking.count({ where }),
      ]);
      items = data.map((b) => this.mapBookingToItem(b, userId));
      total = count;
    } else if (tab === SessionTab.REJECTED) {
      const where = { ...bookingBaseWhere, status: BookingStatus.REJECTED };
      const [data, count] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }, // <-- THÊM SKIP & TAKE
          include: {
            mentor: true,
            candidate: true,
            coachingPlan: true,
            logs: true,
          },
        }),
        this.prisma.booking.count({ where }),
      ]);
      items = data.map((b) => this.mapRejectedBookingToItem(b, userId));
      total = count;
    } else if (tab === SessionTab.UPCOMING) {
      // <--- THÊM TOÀN BỘ KHỐI NÀY
      const where = {
        ...mockSessionBaseWhere,
        status: SessionStatus.SCHEDULED,
      };
      const [data, count] = await Promise.all([
        this.prisma.mockSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'asc' },
          include: {
            booking: {
              include: { mentor: true, candidate: true, coachingPlan: true },
            },
            match: { include: { candidateA: true, candidateB: true } },
            feedbacks: { where: { revieweeId: userId } },
          },
        }),
        this.prisma.mockSession.count({ where }),
      ]);
      items = data.map((s) => this.mapMockSessionToItem(s, userId));
      total = count;
    } else if (tab === SessionTab.FINISHED) {
      const where = {
        ...mockSessionBaseWhere,
        status: SessionStatus.COMPLETED,
      };
      const [data, count] = await Promise.all([
        this.prisma.mockSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'desc' }, // <-- THÊM SKIP & TAKE
          include: {
            booking: {
              include: { mentor: true, candidate: true, coachingPlan: true },
            },
            match: { include: { candidateA: true, candidateB: true } },
            feedbacks: { where: { revieweeId: userId } },
          },
        }),
        this.prisma.mockSession.count({ where }),
      ]);
      items = data.map((s) => this.mapFinishedSessionToItem(s, userId));
      total = count;
    }

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async cancelSession(userId: number, sessionId: number, reason: string) {
    // 1. Tìm session (có thể là booking hoặc mockSession)
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: sessionId,
        OR: [{ mentorId: userId }, { candidateId: userId }],
        status: {
          in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.ACCEPTED],
        },
      },
      include: { mockSessions: true },
    });

    const mockSession = await this.prisma.mockSession.findFirst({
      where: {
        id: sessionId,
        OR: [
          { intervieweeId: userId },
          { booking: { mentorId: userId } },
          { match: { candidateAId: userId } },
          { match: { candidateBId: userId } },
        ],
        status: SessionStatus.SCHEDULED,
      },
      include: {
        booking: { select: { mentorId: true, candidateId: true } },
        match: { select: { candidateAId: true, candidateBId: true } },
      },
    });

    if (!booking && !mockSession) {
      throw new Error('Không tìm thấy phiên học hoặc bạn không có quyền huỷ');
    }

    const affectedUserIds = new Set<number>();

    // 2. Cập nhật trạng thái và ghi log lý do
    if (booking) {
      affectedUserIds.add(booking.mentorId);
      affectedUserIds.add(booking.candidateId);

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          logs: {
            create: {
              actorId: userId,
              action: 'CANCEL_BOOKING',
              note: reason,
              statusBefore: booking.status,
              statusAfter: BookingStatus.CANCELLED,
            },
          },
        },
      });
      // Nếu có mock session liên quan, cập nhật status
      if (booking.mockSessions.length) {
        await this.prisma.mockSession.updateMany({
          where: { bookingId: booking.id },
          data: { status: SessionStatus.CANCELLED },
        });
      }
    } else if (mockSession) {
      affectedUserIds.add(mockSession.intervieweeId);
      if (mockSession.booking) {
        affectedUserIds.add(mockSession.booking.mentorId);
        affectedUserIds.add(mockSession.booking.candidateId);
      }
      await this.prisma.mockSession.update({
        where: { id: mockSession.id },
        data: { status: SessionStatus.CANCELLED },
      });
    }
    await this.sessionQueue.remove(`session-${sessionId}`);
    await this.sessionQueue.remove(`session-start-${sessionId}`);

    for (const id of affectedUserIds) {
      this.socketService.emitToUser(id, 'SESSION_CANCELED', {
        sessionId,
        reason,
      });
    }

    return { success: true, message: 'Session canceled successfully' };
  }

  // ==================== MAPPERS ====================

  private mapMockSessionToItem(session: any, userId: number): SessionItem {
    let opponent: {
      id: number;
      name: string;
      avatarUrl: string | null;
    } | null = null;
    let type = 'SOLO';
    let planName: string | null = null;
    let createdAtStr =
      session.scheduledAt?.toISOString() || new Date().toISOString();

    if (session.booking) {
      type = 'MENTOR';
      planName = session.booking.coachingPlan?.title || null;
      opponent =
        session.booking.mentorId === userId
          ? session.booking.candidate
          : session.booking.mentor;
      createdAtStr = session.booking.createdAt.toISOString();
    } else if (session.match) {
      type = 'P2P';
      opponent =
        session.match.candidateAId === userId
          ? session.match.candidateB
          : session.match.candidateA;
      createdAtStr = session.match.createdAt?.toISOString();
    }

    let status = session.status;
    if (status === 'SCHEDULED') status = 'UPCOMING';
    else if (status === 'COMPLETED') status = 'FINISHED';

    return {
      id: session.id,
      type,
      status: status,
      opponentId: opponent?.id || null,
      opponentName: opponent?.name || 'Unknown',
      opponentAvatar: opponent?.avatarUrl || null,
      coachingPlan: planName,
      scheduledAt: session.scheduledAt?.toISOString() || null,
      createdAt: createdAtStr,
      meetingLink: session.meetingLink || null,
      recordingUrl: null,
      rejectedReason: null,
      hasFeedback: false,
    };
  }

  private async getSessionsByType(
    userId: number,
    type: SessionSource,
    query: any,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      statuses,
    } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.MockSessionWhereInput = {
      source: type,
      OR: [
        { intervieweeId: userId },
        { booking: { mentorId: userId } },
        { match: { candidateAId: userId } },
        { match: { candidateBId: userId } },
      ],
      ...this.buildSearchCondition(search),
      ...this.buildDateCondition('scheduledAt', startDate, endDate),
    };

    if (statuses) {
      const statusArray = Array.isArray(statuses) ? statuses : [statuses];
      if (statusArray.length > 0) {
        where.status = { in: statusArray };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.mockSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          booking: {
            include: { mentor: true, candidate: true, coachingPlan: true },
          },
          match: { include: { candidateA: true, candidateB: true } },
          feedbacks: { where: { revieweeId: userId } },
        },
      }),
      this.prisma.mockSession.count({ where }),
    ]);

    const items = data.map((session) =>
      this.mapMockSessionToItem(session, userId),
    );
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  private mapBookingToItem(booking: any, userId: number): SessionItem {
    const opponent: {
      id: number;
      name: string;
      avatarUrl: string | null;
    } | null = booking.mentorId === userId ? booking.candidate : booking.mentor;
    return {
      id: booking.id,
      type: 'MENTOR',
      status: 'PENDING',
      opponentId: opponent?.id || null,
      opponentName: opponent?.name || 'Unknown',
      opponentAvatar: opponent?.avatarUrl || null,
      coachingPlan: booking.coachingPlan?.title || null,
      scheduledAt: booking.startTime?.toISOString() || null,
      createdAt: booking.createdAt.toISOString(),
      meetingLink: null,
      recordingUrl: null,
      rejectedReason: null,
      hasFeedback: false,
    };
  }

  private mapRejectedBookingToItem(booking: any, userId: number): SessionItem {
    const opponent: {
      id: number;
      name: string;
      avatarUrl: string | null;
    } | null = booking.mentorId === userId ? booking.candidate : booking.mentor;
    // Lấy lý do từ chối từ log gần nhất
    const rejectLog = booking.logs?.find((log: any) => log.action === 'REJECT');
    const rejectedReason = rejectLog?.note || null;
    return {
      id: booking.id,
      type: 'MENTOR',
      status: 'REJECTED',
      opponentId: opponent?.id || null,
      opponentName: opponent?.name || 'Unknown',
      opponentAvatar: opponent?.avatarUrl || null,
      coachingPlan: booking.coachingPlan?.title || null,
      scheduledAt: booking.startTime?.toISOString() || null,
      createdAt: booking.createdAt.toISOString(),
      meetingLink: null,
      recordingUrl: null,
      rejectedReason,
      hasFeedback: false,
    };
  }

  private mapFinishedSessionToItem(session: any, userId: number): SessionItem {
    let opponent: {
      id: number;
      name: string;
      avatarUrl: string | null;
    } | null = null;
    let type = 'SOLO';
    let planName: string | null = null;
    let createdAtStr =
      session.scheduledAt?.toISOString() || new Date().toISOString();

    if (session.booking) {
      type = 'MENTOR';
      planName = session.booking.coachingPlan?.title || null;
      opponent =
        session.booking.mentorId === userId
          ? session.booking.candidate
          : session.booking.mentor;
      createdAtStr = session.booking.createdAt.toISOString();
    } else if (session.match) {
      type = 'P2P';
      opponent =
        session.match.candidateAId === userId
          ? session.match.candidateB
          : session.match.candidateA;
      createdAtStr = session.match.createdAt?.toISOString();
    }

    const hasFeedback = session.feedbacks && session.feedbacks.length > 0;
    return {
      id: session.id,
      type,
      status: 'FINISHED',
      opponentId: opponent?.id || null,
      opponentName: opponent?.name || 'Unknown',
      opponentAvatar: opponent?.avatarUrl || null,
      coachingPlan: planName,
      scheduledAt: session.scheduledAt?.toISOString() || null,
      createdAt: createdAtStr,
      meetingLink: session.meetingLink || null,
      recordingUrl: session.recordingUrl || null,
      rejectedReason: null,
      hasFeedback,
    };
  }

  // HELPERS
  private buildSearchCondition(searchTerm?: string) {
    if (!searchTerm) return {};
    return {
      AND: [
        // Bọc trong AND để không ghi đè OR bên ngoài
        {
          OR: [
            {
              booking: {
                coachingPlan: {
                  title: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
            {
              booking: {
                mentor: { name: { contains: searchTerm, mode: 'insensitive' } },
              },
            },
            {
              booking: {
                candidate: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
            {
              match: {
                candidateA: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
            {
              match: {
                candidateB: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
            {
              interviewee: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          ],
        },
      ],
    };
  }

  private buildDateCondition(
    dateField: string,
    startDate?: string,
    endDate?: string,
  ) {
    const condition: any = {};
    if (startDate) condition[dateField] = { gte: new Date(startDate) };
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      condition[dateField] = { ...condition[dateField], lte: end };
    }
    return condition;
  }
  private buildStartJobConfig(session: any, userIds: number[]) {
    const delay = Math.max(session.scheduledAt.getTime() - Date.now(), 0);
    return {
      name: 'start-session-notification',
      data: {
        sessionId: session.id,
        userIds,
        meetingLink: session.meetingLink,
      },
      opts: { delay, jobId: `session-start-${session.id}` },
    };
  }
  private buildEndJobConfig(session: any, userIds: number[]) {
    const duration = session.durationMinutes || 60;
    const endTime = new Date(
      session.scheduledAt.getTime() + duration * 60 * 1000,
    );
    const delay = Math.max(endTime.getTime() - Date.now(), 0);
    return {
      name: 'end-session',
      data: { sessionId: session.id, userIds },
      opts: { delay, jobId: `session-${session.id}` },
    };
  }
}
