import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private getMonthRange(offsetMonths = 0): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + offsetMonths + 1,
      1,
    );
    return { start, end };
  }

  private calcDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal
  }

  // ─── main stats with month-over-month delta ──────────────────────────────

  async getStats() {
    const thisMonth = this.getMonthRange(0);
    const lastMonth = this.getMonthRange(-1);

    const [
      // totals
      totalUsers,
      totalMentors,
      totalCandidates,
      totalQuestions,
      totalBookings,
      pendingReports,

      // this month new registrations
      newUsersThisMonth,
      newMentorsThisMonth,
      newCandidatesThisMonth,
      newBookingsThisMonth,

      // last month new registrations (for delta)
      newUsersLastMonth,
      newMentorsLastMonth,
      newCandidatesLastMonth,
      newBookingsLastMonth,

      // pending reports last month
      pendingReportsLastMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'MENTOR' } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.question.count(),
      this.prisma.booking.count(),
      this.prisma.userReport.count({ where: { status: 'PENDING' } }),

      this.prisma.user.count({
        where: { createdAt: { gte: thisMonth.start, lt: thisMonth.end } },
      }),
      this.prisma.user.count({
        where: {
          role: 'MENTOR',
          createdAt: { gte: thisMonth.start, lt: thisMonth.end },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'CANDIDATE',
          createdAt: { gte: thisMonth.start, lt: thisMonth.end },
        },
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: thisMonth.start, lt: thisMonth.end } },
      }),

      this.prisma.user.count({
        where: { createdAt: { gte: lastMonth.start, lt: lastMonth.end } },
      }),
      this.prisma.user.count({
        where: {
          role: 'MENTOR',
          createdAt: { gte: lastMonth.start, lt: lastMonth.end },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'CANDIDATE',
          createdAt: { gte: lastMonth.start, lt: lastMonth.end },
        },
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: lastMonth.start, lt: lastMonth.end } },
      }),

      this.prisma.userReport.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: lastMonth.start, lt: lastMonth.end },
        },
      }),
    ]);

    const pendingReportsThisMonth = await this.prisma.userReport.count({
      where: {
        status: 'PENDING',
        createdAt: { gte: thisMonth.start, lt: thisMonth.end },
      },
    });

    return {
      totalUsers,
      totalMentors,
      totalCandidates,
      totalQuestions,
      totalBookings,
      pendingReports,
      delta: {
        totalUsers: this.calcDelta(newUsersThisMonth, newUsersLastMonth),
        totalMentors: this.calcDelta(newMentorsThisMonth, newMentorsLastMonth),
        totalCandidates: this.calcDelta(
          newCandidatesThisMonth,
          newCandidatesLastMonth,
        ),
        totalBookings: this.calcDelta(
          newBookingsThisMonth,
          newBookingsLastMonth,
        ),
        pendingReports: this.calcDelta(
          pendingReportsThisMonth,
          pendingReportsLastMonth,
        ),
      },
    };
  }

  // ─── user + booking growth chart (last 6 months) ────────────────────────

  async getGrowthChart() {
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const { start, end } = this.getMonthRange(-i);
      const label = start.toLocaleDateString('vi-VN', {
        month: 'short',
        year: '2-digit',
      });
      months.push({ label, start, end });
    }

    const results = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [newUsers, newBookings] = await Promise.all([
          this.prisma.user.count({
            where: { createdAt: { gte: start, lt: end } },
          }),
          this.prisma.booking.count({
            where: { createdAt: { gte: start, lt: end } },
          }),
        ]);
        return { month: label, newUsers, newBookings };
      }),
    );

    return results;
  }

  // ─── top 5 mentors this month ────────────────────────────────────────────

  async getTopMentors() {
    const { start, end } = this.getMonthRange(0);

    const topMentors = await this.prisma.booking.groupBy({
      by: ['mentorId'],
      where: {
        createdAt: { gte: start, lt: end },
        status: { in: ['ACCEPTED', 'COMPLETED'] },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    if (topMentors.length === 0) return [];

    const mentorIds = topMentors.map((m) => m.mentorId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: mentorIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        feedbacksReceived: {
          select: { overallScore: true },
          where: { status: 'SUBMITTED' },
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topMentors.map((entry, index) => {
      const user = userMap.get(entry.mentorId);
      const scores = user?.feedbacksReceived?.map((f) => f.overallScore) ?? [];
      const avgRating =
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
            ) / 10
          : null;

      return {
        rank: index + 1,
        id: entry.mentorId,
        name: user?.name ?? 'Unknown',
        avatarUrl: user?.avatarUrl ?? null,
        bookingCount: entry._count.id,
        avgRating,
      };
    });
  }
}
