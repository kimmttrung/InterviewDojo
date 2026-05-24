import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSessionsDto, SessionTab } from './dto/get-sessions.dto';
import {
  PaginatedResponse,
  SessionItem,
} from './interfaces/session.interfaces';
import { Prisma, SessionStatus, BookingStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
@Injectable()
export class SessionService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('session') private sessionQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.prisma.mockSession.updateMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledAt: { lt: new Date() },
      },
      data: { status: SessionStatus.COMPLETED },
    });
    await this.scheduleAllUpcomingSessions();
  }

  private async scheduleAllUpcomingSessions() {
    const upcomingSessions = await this.prisma.mockSession.findMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledAt: { gt: new Date() },
      },
      include: {
        booking: { select: { mentorId: true, candidateId: true } },
        match: { select: { candidateAId: true, candidateBId: true } },
      },
    });

    for (const session of upcomingSessions) {
      const userIds: number[] = [session.intervieweeId];
      if (session.booking) {
        userIds.push(session.booking.mentorId, session.booking.candidateId);
      } else if (session.match) {
        userIds.push(session.match.candidateAId, session.match.candidateBId);
      }
      const uniqueUserIds = [...new Set(userIds)];
      await this.scheduleSessionEnd(
        session.id,
        uniqueUserIds,
        session.scheduledAt,
        session.durationMinutes,
      );
    }
  }

  async scheduleSessionEnd(
    sessionId: number,
    userIds: number[],
    scheduledAt: Date,
    durationMinutes: number,
  ) {
    const endTime = new Date(
      scheduledAt.getTime() + durationMinutes * 60 * 1000,
    );
    const delay = endTime.getTime() - Date.now();
    if (delay > 0) {
      const jobId = `session-${sessionId}`;
      const existingJob = await this.sessionQueue.getJob(jobId);
      if (!existingJob) {
        await this.sessionQueue.add(
          'end-session',
          { sessionId, userIds },
          { delay, jobId },
        );
        console.log(`✅ Scheduled end for session ${sessionId} in ${delay}ms`);
      }
    }
  }

  async getSessions(
    userId: number,
    query: GetSessionsDto,
  ): Promise<PaginatedResponse<SessionItem>> {
    const { page = 1, limit = 10, tab, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Hàm helper xây dựng điều kiện tìm kiếm mở rộng (cho các bảng khác nhau)
    const buildSearchCondition = (searchTerm?: string) => {
      if (!searchTerm) return {};
      return {
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
          }, // solo
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

    // Định nghĩa các promise lấy dữ liệu và đếm cho từng loại (dùng cho tab ALL)
    const fetchAndCount = {
      upcoming: async () => {
        const where: Prisma.MockSessionWhereInput = {
          status: SessionStatus.SCHEDULED,
          OR: [
            { intervieweeId: userId },
            { booking: { mentorId: userId } },
            { match: { candidateAId: userId } },
            { match: { candidateBId: userId } },
          ],
          ...buildSearchCondition(search),
          ...buildDateCondition('scheduledAt'),
        };
        const [data, count] = await Promise.all([
          this.prisma.mockSession.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
              booking: {
                include: { mentor: true, candidate: true, coachingPlan: true },
              },
              match: { include: { candidateA: true, candidateB: true } },
            },
          }),
          this.prisma.mockSession.count({ where }),
        ]);
        const mapped = data.map((session) =>
          this.mapMockSessionToItem(session, userId),
        );
        return { items: mapped, count };
      },

      pending: async () => {
        const where: Prisma.BookingWhereInput = {
          status: BookingStatus.PENDING_ACCEPTANCE,
          OR: [{ candidateId: userId }, { mentorId: userId }],
          ...buildSearchCondition(search),
          ...buildDateCondition('createdAt'),
        };
        const [data, count] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { mentor: true, candidate: true, coachingPlan: true },
          }),
          this.prisma.booking.count({ where }),
        ]);
        const mapped = data.map((booking) =>
          this.mapBookingToItem(booking, userId),
        );
        return { items: mapped, count };
      },

      rejected: async () => {
        // Lấy các booking bị từ chối
        const where: Prisma.BookingWhereInput = {
          status: BookingStatus.REJECTED,
          OR: [{ candidateId: userId }, { mentorId: userId }],
          ...buildSearchCondition(search),
          ...buildDateCondition('createdAt'),
        };
        const [data, count] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
              mentor: true,
              candidate: true,
              coachingPlan: true,
              logs: true,
            },
          }),
          this.prisma.booking.count({ where }),
        ]);
        const mapped = data.map((booking) =>
          this.mapRejectedBookingToItem(booking, userId),
        );
        return { items: mapped, count };
      },

      finished: async () => {
        // Lấy các mock session đã hoàn thành (kể cả mentor, p2p, solo)
        const where: Prisma.MockSessionWhereInput = {
          status: SessionStatus.COMPLETED,
          OR: [
            { intervieweeId: userId },
            { booking: { mentorId: userId } },
            { match: { candidateAId: userId } },
            { match: { candidateBId: userId } },
          ],
          ...buildSearchCondition(search),
          ...buildDateCondition('scheduledAt'),
        };
        const [data, count] = await Promise.all([
          this.prisma.mockSession.findMany({
            where,
            orderBy: { scheduledAt: 'desc' },
            include: {
              booking: {
                include: { mentor: true, candidate: true, coachingPlan: true },
              },
              match: { include: { candidateA: true, candidateB: true } },
              feedbacks: { where: { revieweeId: userId } }, // lấy feedback dành cho user
            },
          }),
          this.prisma.mockSession.count({ where }),
        ]);
        const mapped = data.map((session) =>
          this.mapFinishedSessionToItem(session, userId),
        );
        return { items: mapped, count };
      },
    };

    // Xử lý theo từng tab
    if (tab === SessionTab.ALL) {
      // Lấy tất cả các loại, gộp lại, sắp xếp theo createdAt/scheduledAt (tuỳ chọn)
      const [upcoming, pending, rejected, finished] = await Promise.all([
        fetchAndCount.upcoming(),
        fetchAndCount.pending(),
        fetchAndCount.rejected(),
        fetchAndCount.finished(),
      ]);
      const allItems = [
        ...upcoming.items,
        ...pending.items,
        ...rejected.items,
        ...finished.items,
      ];
      // Sắp xếp theo thời gian (mới nhất trước)
      allItems.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      total = allItems.length;
      // Phân trang thủ công cho tab ALL
      items = allItems.slice(skip, skip + limit);
    } else if (tab === SessionTab.UPCOMING) {
      const { items: upcomingItems, count } = await fetchAndCount.upcoming();
      items = upcomingItems.slice(skip, skip + limit);
      total = count;
    } else if (tab === SessionTab.PENDING) {
      const { items: pendingItems, count } = await fetchAndCount.pending();
      items = pendingItems.slice(skip, skip + limit);
      total = count;
    } else if (tab === SessionTab.REJECTED) {
      const { items: rejectedItems, count } = await fetchAndCount.rejected();
      items = rejectedItems.slice(skip, skip + limit);
      total = count;
    } else if (tab === SessionTab.FINISHED) {
      const { items: finishedItems, count } = await fetchAndCount.finished();
      items = finishedItems.slice(skip, skip + limit);
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
    });

    if (!booking && !mockSession) {
      throw new Error('Không tìm thấy phiên học hoặc bạn không có quyền hủy');
    }

    // 2. Cập nhật trạng thái và ghi log lý do
    if (booking) {
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
      await this.prisma.mockSession.update({
        where: { id: mockSession.id },
        data: { status: SessionStatus.CANCELLED },
      });
      // Ghi log riêng nếu cần (có thể tạo bảng log)
    }

    // 3. Emit socket event để frontend reload
    // this.socketService.emitToUser(userId, 'SESSION_UPDATED', { sessionId });
    await this.sessionQueue.removeJobs(`session-${sessionId}`);
    return { success: true, message: 'Đã hủy phiên học' };
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
      createdAtStr = session.match.createdAt.toISOString();
    }

    return {
      id: session.id,
      type,
      status: 'UPCOMING',
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
    const rejectLog = booking.logs?.find(
      (log: any) => log.action === 'REJECT_BOOKING',
    );
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
      createdAtStr = session.match.createdAt.toISOString();
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
}
