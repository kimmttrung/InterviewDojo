import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  MentorPayout,
  MentorPayoutStatus,
  Prisma,
  SessionSource,
  SessionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { QueryMentorPayoutDto } from './dto/query-mentor-payout.dto';

const payableBookingStatuses: BookingStatus[] = [
  BookingStatus.ACCEPTED,
  BookingStatus.COMPLETED,
];

@Injectable()
export class MentorPayoutService {
  private readonly logger = new Logger(MentorPayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createPendingPayoutForCompletedSession(sessionId: number) {
    const platformFeePercent = this.getPlatformFeePercent();

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.mockSession.findUnique({
        where: { id: sessionId },
        include: {
          booking: true,
          mentorPayout: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      if (
        session.status !== SessionStatus.COMPLETED ||
        session.source !== SessionSource.MENTOR_BOOKING ||
        !session.booking
      ) {
        return null;
      }

      if (session.mentorPayout) {
        return session.mentorPayout;
      }

      if (!payableBookingStatuses.includes(session.booking.status)) {
        return null;
      }

      const grossAmount = session.booking.snapshotPlanPrice;
      if (!grossAmount || grossAmount <= 0) {
        throw new BadRequestException('Booking price is not available');
      }

      const platformFeeAmount = this.roundMoney(
        (grossAmount * platformFeePercent) / 100,
      );
      const mentorEarning = this.roundMoney(grossAmount - platformFeeAmount);

      if (session.booking.status === BookingStatus.ACCEPTED) {
        await tx.booking.update({
          where: { id: session.booking.id },
          data: { status: BookingStatus.COMPLETED },
        });
      }

      return tx.mentorPayout.create({
        data: {
          sessionId: session.id,
          bookingId: session.booking.id,
          mentorId: session.booking.mentorId,
          candidateId: session.booking.candidateId,
          grossAmount,
          platformFeePercent,
          platformFeeAmount,
          mentorEarning,
          refundableAmount: grossAmount,
          status: MentorPayoutStatus.PENDING,
        },
      });
    });
  }

  async createPendingPayoutSafely(sessionId: number) {
    try {
      return await this.createPendingPayoutForCompletedSession(sessionId);
    } catch (error) {
      this.logger.error(
        `Failed to create pending mentor payout for session ${sessionId}`,
        error instanceof Error ? error.stack : error,
      );
      return null;
    }
  }

  async getPayouts(dto: QueryMentorPayoutDto) {
    const { page = 1, limit = 15, status } = dto;
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.MentorPayoutWhereInput = {};

    if (status) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      this.prisma.mentorPayout.count({ where }),
      this.prisma.mentorPayout.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: this.payoutInclude(),
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async approvePayout(payoutId: number, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await this.markPayoutReviewed(
        tx,
        payoutId,
        adminId,
        MentorPayoutStatus.COMPLETED,
      );

      const mentorBefore = await tx.user.findUnique({
        where: { id: payout.mentorId },
        select: { creditBalance: true },
      });

      if (!mentorBefore) {
        throw new NotFoundException('Mentor not found');
      }

      const mentorAfter = await tx.user.update({
        where: { id: payout.mentorId },
        data: { creditBalance: { increment: payout.mentorEarning } },
        select: { creditBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId: payout.mentorId,
          type: WalletTransactionType.PAYOUT,
          amount: payout.mentorEarning,
          balanceBefore: mentorBefore.creditBalance,
          balanceAfter: mentorAfter.creditBalance,
          referenceId: this.payoutReferenceId(payout.id),
          note: `Mentor payout for session ${payout.sessionId}`,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: null,
          type: WalletTransactionType.PLATFORM_FEE,
          amount: payout.platformFeeAmount,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceId: this.payoutReferenceId(payout.id),
          note: `Platform fee ${payout.platformFeePercent}% for session ${payout.sessionId}`,
        },
      });

      return this.findPayoutById(tx, payout.id);
    });
  }

  async rejectPayout(
    payoutId: number,
    adminId: number,
    reason: string,
    refundableAmount?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.mentorPayout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      if (payout.status !== MentorPayoutStatus.PENDING) {
        throw new BadRequestException('Payout is not pending');
      }

      const refundAmount = this.resolveRefundAmount(payout, refundableAmount);

      const updatedPayout = await tx.mentorPayout.update({
        where: { id: payoutId },
        data: {
          status: MentorPayoutStatus.REJECTED,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
          rejectReason: reason,
          refundableAmount: refundAmount,
        },
      });

      if (refundAmount > 0) {
        const candidateBefore = await tx.user.findUnique({
          where: { id: updatedPayout.candidateId },
          select: { creditBalance: true },
        });

        if (!candidateBefore) {
          throw new NotFoundException('Candidate not found');
        }

        const candidateAfter = await tx.user.update({
          where: { id: updatedPayout.candidateId },
          data: { creditBalance: { increment: refundAmount } },
          select: { creditBalance: true },
        });

        await tx.walletTransaction.create({
          data: {
            userId: updatedPayout.candidateId,
            type: WalletTransactionType.REFUND,
            amount: refundAmount,
            balanceBefore: candidateBefore.creditBalance,
            balanceAfter: candidateAfter.creditBalance,
            referenceId: this.payoutReferenceId(updatedPayout.id),
            note: `Refund after rejected mentor payout for session ${updatedPayout.sessionId}: ${reason}`,
          },
        });
      }

      return this.findPayoutById(tx, updatedPayout.id);
    });
  }

  private async markPayoutReviewed(
    tx: Prisma.TransactionClient,
    payoutId: number,
    adminId: number,
    status: MentorPayoutStatus,
  ) {
    const updateResult = await tx.mentorPayout.updateMany({
      where: { id: payoutId, status: MentorPayoutStatus.PENDING },
      data: {
        status,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      const existing = await tx.mentorPayout.findUnique({
        where: { id: payoutId },
      });

      if (!existing) {
        throw new NotFoundException('Payout not found');
      }

      throw new BadRequestException('Payout is not pending');
    }

    return tx.mentorPayout.findUniqueOrThrow({ where: { id: payoutId } });
  }

  private async findPayoutById(tx: Prisma.TransactionClient, payoutId: number) {
    return tx.mentorPayout.findUniqueOrThrow({
      where: { id: payoutId },
      include: this.payoutInclude(),
    });
  }

  private resolveRefundAmount(payout: MentorPayout, refundableAmount?: number) {
    const refundAmount = refundableAmount ?? payout.refundableAmount;

    if (refundAmount < 0 || refundAmount > payout.grossAmount) {
      throw new BadRequestException('Refund amount is invalid');
    }

    return this.roundMoney(refundAmount);
  }

  private getPlatformFeePercent() {
    const value = Number(this.configService.get('PLATFORM_FEE_PERCENT') ?? 10);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new BadRequestException('PLATFORM_FEE_PERCENT is invalid');
    }

    return value;
  }

  private payoutReferenceId(payoutId: number) {
    return `payout:${payoutId}`;
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private payoutInclude() {
    return {
      mentor: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      candidate: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      reviewedByAdmin: { select: { id: true, name: true, email: true } },
      booking: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          snapshotPlanTitle: true,
          snapshotPlanPrice: true,
          status: true,
        },
      },
      session: {
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          status: true,
          endedAt: true,
        },
      },
    } satisfies Prisma.MentorPayoutInclude;
  }
}
