import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalMentors,
      totalCandidates,
      totalQuestions,
      totalBookings,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'MENTOR' } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.question.count(),
      this.prisma.booking.count(),
      this.prisma.userReport.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalMentors,
      totalCandidates,
      totalQuestions,
      totalBookings,
      pendingReports,
    };
  }
}
