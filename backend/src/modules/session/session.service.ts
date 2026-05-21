import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSessionsDto, SessionTab } from './dto/get-sessions.dto';
import {
  PaginatedResponse,
  SessionItem,
} from './interfaces/session.interfaces';
import { Prisma, SessionStatus } from '@prisma/client'; // Import thêm Enum và Type từ Prisma

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async getSessions(
    userId: number,
    query: GetSessionsDto,
  ): Promise<PaginatedResponse<SessionItem>> {
    // FIX 1: Gán giá trị mặc định để tránh lỗi 'undefined'
    const { page = 1, limit = 10, tab, search } = query;
    const skip = (page - 1) * limit;

    let items: SessionItem[] = [];
    let total = 0;

    if (tab === SessionTab.UPCOMING) {
      // FIX 2: Ép kiểu explicitly và dùng Enum SessionStatus thay vì chuỗi cứng
      const whereCondition: Prisma.MockSessionWhereInput = {
        status: SessionStatus.SCHEDULED,
        OR: [
          { intervieweeId: userId },
          { booking: { mentorId: userId } },
          { match: { candidateAId: userId } },
          { match: { candidateBId: userId } },
        ],
        ...(search && {
          booking: {
            coachingPlan: { title: { contains: search, mode: 'insensitive' } },
          },
        }),
      };

      const [mockSessions, count] = await Promise.all([
        this.prisma.mockSession.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'asc' },
          include: {
            booking: {
              include: { mentor: true, candidate: true, coachingPlan: true },
            },
            match: {
              include: { candidateA: true, candidateB: true },
            },
          },
        }),
        this.prisma.mockSession.count({ where: whereCondition }),
      ]);

      total = count;

      items = mockSessions.map((session) => {
        let opponent: any = null;
        let type = 'SOLO';
        let planName: string | null = null;
        let createdAtStr = ''; // FIX 3: Khởi tạo chuỗi rỗng để tránh gán null

        if (session.booking) {
          type = 'MENTOR';
          planName = session.booking.coachingPlan?.title || null;
          opponent =
            session.booking.mentorId === userId
              ? session.booking.candidate
              : session.booking.mentor;
          // Lấy createdAt từ booking
          createdAtStr = session.booking.createdAt.toISOString();
        } else if (session.match) {
          type = 'P2P';
          opponent =
            session.match.candidateAId === userId
              ? session.match.candidateB
              : session.match.candidateA;
          // Lấy createdAt từ match
          createdAtStr = session.match.createdAt.toISOString();
        }

        return {
          id: session.id,
          type: type,
          status: 'UPCOMING',
          opponentName: opponent?.name || 'Unknown',
          opponentAvatar: opponent?.avatarUrl || null,
          coachingPlan: planName,
          scheduledAt: session.scheduledAt
            ? session.scheduledAt.toISOString()
            : null,
          createdAt: createdAtStr, // Trả về kiểu string chuẩn theo Interface
          meetingLink: session.meetingLink || null,
          recordingUrl: null,
          rejectedReason: null,
          hasFeedback: false,
        };
      });
    }

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
