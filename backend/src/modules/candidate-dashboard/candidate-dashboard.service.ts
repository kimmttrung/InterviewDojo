import { Injectable } from '@nestjs/common';
import { AiService } from '../ai-summary/ai-summary.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus, SessionSource } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly aiService: AiService,
  ) {}

  // =========================================================
  // UPCOMING SESSIONS
  // =========================================================

  async getUpcomingSessions(userId: number) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        candidateId: userId,

        status: BookingStatus.ACCEPTED,

        startTime: {
          gte: new Date(),
        },
      },

      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },

        coachingPlan: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
      },

      orderBy: {
        startTime: 'asc',
      },

      take: 3,
    });

    return bookings.map((booking) => ({
      id: booking.id,

      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.name,

        avatarUrl: booking.mentor.avatarUrl,
      },

      coachingPlan: {
        id: booking.coachingPlan.id,

        title: booking.coachingPlan.title,

        duration: booking.coachingPlan.duration,
      },

      startTime: booking.startTime,

      endTime: booking.endTime,

      status: booking.status,
    }));
  }

  // =========================================================
  // AI SUMMARY
  // =========================================================

  async getAISummary(userId: number) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        revieweeId: userId,
      },

      include: {
        session: {
          select: {
            source: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 30,
    });

    const mentorFeedbacks = feedbacks.filter(
      (feedback) => feedback.session.source === SessionSource.MENTOR_BOOKING,
    );

    const soloFeedbacks = feedbacks.filter(
      (feedback) => feedback.session.source === SessionSource.SOLO,
    );

    const p2pFeedbacks = feedbacks.filter(
      (feedback) => feedback.session.source === SessionSource.P2P_MATCH,
    );

    // =====================================================
    // PREPARE RAW FEEDBACKS
    // =====================================================

    const formatFeedbacks = (items: typeof feedbacks) => {
      return items.map((item) => ({
        strengths: item.strengths ?? [],

        weaknesses: item.weaknesses ?? [],

        suggestions: item.suggestions ?? [],

        comment: item.comment,

        score: item.overallScore,
      }));
    };

    const aiSummary = await this.aiService.summarizeFeedbacks(
      formatFeedbacks(mentorFeedbacks),

      formatFeedbacks(soloFeedbacks),

      formatFeedbacks(p2pFeedbacks),
    );

    return aiSummary;
  }

  // =========================================================
  // ANALYTICS OVERVIEW
  // =========================================================

  async getAnalyticsOverview(userId: number) {
    const [feedbacks, mockSessions, codeSubmissionCount, savedQuestionCount] =
      await Promise.all([
        // =====================================
        // FEEDBACKS
        // =====================================

        this.prisma.feedback.findMany({
          where: {
            revieweeId: userId,
          },

          select: {
            overallScore: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: 'asc',
          },
        }),

        // =====================================
        // MOCK SESSIONS
        // =====================================

        this.prisma.mockSession.findMany({
          where: {
            intervieweeId: userId,
          },

          select: {
            id: true,
            source: true,
          },
        }),

        // =====================================
        // CODE SUBMISSIONS
        // =====================================

        this.prisma.codeSubmission.count({
          where: {
            userId,
          },
        }),

        // =====================================
        // SAVED QUESTIONS
        // =====================================

        this.prisma.userBookmark.count({
          where: {
            userId,
          },
        }),
      ]);

    // =====================================================
    // OVERALL SCORE
    // =====================================================

    const overallScore =
      feedbacks.length > 0
        ? Number(
            (
              feedbacks.reduce(
                (sum, feedback) => sum + feedback.overallScore,
                0,
              ) / feedbacks.length
            ).toFixed(1),
          )
        : 0;

    // =====================================================
    // SCORE CHART
    // =====================================================

    const scoreChart = feedbacks.map((feedback) => ({
      date: feedback.createdAt,

      score: feedback.overallScore,
    }));

    // =====================================================
    // SESSION BREAKDOWN
    // =====================================================

    const mentorSessions = mockSessions.filter(
      (session) => session.source === SessionSource.MENTOR_BOOKING,
    ).length;

    const p2pSessions = mockSessions.filter(
      (session) => session.source === SessionSource.P2P_MATCH,
    ).length;

    const soloSessions = mockSessions.filter(
      (session) => session.source === SessionSource.SOLO,
    ).length;

    return {
      completedSessions: mockSessions.length,

      overallScore,

      completedCodingQuestions: codeSubmissionCount,

      savedQuestions: savedQuestionCount,

      sessionBreakdown: {
        mentor: mentorSessions,

        p2p: p2pSessions,

        solo: soloSessions,
      },

      scoreChart,
    };
  }

  // =========================================================
  // INTERESTED CATEGORIES
  // =========================================================

  async getInterestedCategories(userId: number) {
    const bookmarks = await this.prisma.userBookmark.findMany({
      where: {
        userId,
      },

      include: {
        question: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const categoryMap = new Map<
      number,
      {
        id: number;
        name: string;
        count: number;
      }
    >();

    bookmarks.forEach((bookmark) => {
      bookmark.question.categories.forEach((questionCategory) => {
        const category = questionCategory.category;

        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            id: category.id,
            name: category.name,

            count: 0,
          });
        }

        categoryMap.get(category.id)!.count += 1;
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
