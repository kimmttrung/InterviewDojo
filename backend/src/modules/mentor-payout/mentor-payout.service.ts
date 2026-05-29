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

  async payoutCompletedSession(sessionId: number) {
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
      const referenceId = this.sessionReferenceId(session.id);

      const existingPayoutTransaction = await tx.walletTransaction.findFirst({
        where: {
          type: WalletTransactionType.PAYOUT,
          referenceId,
        },
      });

      if (existingPayoutTransaction) {
        if (session.mentorPayout) {
          return tx.mentorPayout.update({
            where: { id: session.mentorPayout.id },
            data: {
              status: MentorPayoutStatus.COMPLETED,
              failureReason: null,
            },
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
            status: MentorPayoutStatus.COMPLETED,
          },
        });
      }

      if (session.booking.status === BookingStatus.ACCEPTED) {
        await tx.booking.update({
          where: { id: session.booking.id },
          data: { status: BookingStatus.COMPLETED },
        });
      }

      const payout = session.mentorPayout
        ? await tx.mentorPayout.update({
            where: { id: session.mentorPayout.id },
            data: {
              grossAmount,
              platformFeePercent,
              platformFeeAmount,
              mentorEarning,
              refundableAmount: grossAmount,
              status: MentorPayoutStatus.PENDING,
              failureReason: null,
            },
          })
        : await tx.mentorPayout.create({
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

      const mentorBefore = await tx.user.findUnique({
        where: { id: session.booking.mentorId },
        select: { creditBalance: true },
      });

      if (!mentorBefore) {
        return tx.mentorPayout.update({
          where: { id: payout.id },
          data: {
            status: MentorPayoutStatus.FAILED,
            failureReason: 'Mentor not found',
          },
        });
      }

      const mentorAfter = await tx.user.update({
        where: { id: session.booking.mentorId },
        data: { creditBalance: { increment: mentorEarning } },
        select: { creditBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId: session.booking.mentorId,
          type: WalletTransactionType.PAYOUT,
          amount: mentorEarning,
          balanceBefore: mentorBefore.creditBalance,
          balanceAfter: mentorAfter.creditBalance,
          referenceId,
          note: `Thanh toan cho session coaching #${session.id}`,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: null,
          type: WalletTransactionType.PLATFORM_FEE,
          amount: platformFeeAmount,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceId,
          note: `Phi nen tang (${platformFeePercent}%)`,
        },
      });

      return tx.mentorPayout.update({
        where: { id: payout.id },
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
          status: MentorPayoutStatus.COMPLETED,
          failureReason: null,
        },
      });
    });
  }

  async payoutCompletedSessionSafely(sessionId: number) {
    try {
      return await this.payoutCompletedSession(sessionId);
    } catch (error) {
      this.logger.error(
        `Failed to payout completed mentor session ${sessionId}`,
        error instanceof Error ? error.stack : error,
      );
      await this.markPayoutFailed(sessionId, error);
      return null;
    }
  }

  async retryPayoutForSession(sessionId: number) {
    return this.payoutCompletedSession(sessionId);
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

  async getRetryablePayoutSessions(dto: QueryMentorPayoutDto) {
    const { page = 1, limit = 15, status } = dto;
    const safeLimit = Math.min(limit, 100);
    const platformFeePercent = this.getPlatformFeePercent();

    const sessions = await this.prisma.mockSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        source: SessionSource.MENTOR_BOOKING,
        booking: {
          is: {
            status: { in: payableBookingStatuses },
            snapshotPlanPrice: { gt: 0 },
          },
        },
      },
      include: {
        mentorPayout: true,
        booking: {
          include: {
            mentor: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            candidate: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: [{ endedAt: 'desc' }, { scheduledAt: 'desc' }],
    });

    const referenceIds = sessions.map((session) =>
      this.sessionReferenceId(session.id),
    );
    const payoutTransactions = referenceIds.length
      ? await this.prisma.walletTransaction.findMany({
          where: {
            type: WalletTransactionType.PAYOUT,
            referenceId: { in: referenceIds },
          },
          select: { referenceId: true },
        })
      : [];
    const paidReferenceIds = new Set(
      payoutTransactions
        .map((transaction) => transaction.referenceId)
        .filter(Boolean),
    );

    const retryableItems = sessions
      .filter(
        (session) => !paidReferenceIds.has(this.sessionReferenceId(session.id)),
      )
      .map((session) => {
        const grossAmount = session.booking!.snapshotPlanPrice ?? 0;
        const platformFeeAmount = this.roundMoney(
          (grossAmount * platformFeePercent) / 100,
        );
        const mentorEarning = this.roundMoney(grossAmount - platformFeeAmount);

        return {
          id: session.mentorPayout?.id ?? session.id,
          sessionId: session.id,
          bookingId: session.booking!.id,
          grossAmount,
          platformFeePercent,
          platformFeeAmount,
          mentorEarning,
          refundableAmount: grossAmount,
          status: session.mentorPayout?.status ?? MentorPayoutStatus.PENDING,
          failureReason: session.mentorPayout?.failureReason ?? null,
          createdAt: session.mentorPayout?.createdAt ?? session.scheduledAt,
          reviewedAt: session.mentorPayout?.reviewedAt ?? null,
          mentor: session.booking!.mentor,
          candidate: session.booking!.candidate,
          booking: {
            id: session.booking!.id,
            startTime: session.booking!.startTime,
            endTime: session.booking!.endTime,
            snapshotPlanTitle: session.booking!.snapshotPlanTitle,
            snapshotPlanPrice: session.booking!.snapshotPlanPrice,
            status: session.booking!.status,
          },
          session: {
            id: session.id,
            scheduledAt: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            status: session.status,
            endedAt: session.endedAt,
          },
        };
      })
      .filter((item) => !status || item.status === status);

    const skip = (page - 1) * safeLimit;
    const items = retryableItems.slice(skip, skip + safeLimit);

    return {
      items,
      meta: {
        total: retryableItems.length,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(retryableItems.length / safeLimit),
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
          referenceId: this.sessionReferenceId(payout.sessionId),
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
          referenceId: this.sessionReferenceId(payout.sessionId),
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
            referenceId: this.sessionReferenceId(updatedPayout.sessionId),
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

  private async markPayoutFailed(sessionId: number, error: unknown) {
    try {
      const session = await this.prisma.mockSession.findUnique({
        where: { id: sessionId },
        include: { booking: true, mentorPayout: true },
      });

      if (
        !session?.booking ||
        session.source !== SessionSource.MENTOR_BOOKING
      ) {
        return;
      }

      const grossAmount = session.booking.snapshotPlanPrice ?? 0;
      const platformFeePercent = this.getPlatformFeePercent();
      const platformFeeAmount = this.roundMoney(
        (grossAmount * platformFeePercent) / 100,
      );
      const mentorEarning = this.roundMoney(grossAmount - platformFeeAmount);
      const failureReason =
        error instanceof Error ? error.message : 'Unknown payout failure';

      if (session.mentorPayout) {
        await this.prisma.mentorPayout.update({
          where: { id: session.mentorPayout.id },
          data: {
            status: MentorPayoutStatus.FAILED,
            failureReason,
          },
        });
        return;
      }

      await this.prisma.mentorPayout.create({
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
          status: MentorPayoutStatus.FAILED,
          failureReason,
        },
      });
    } catch (markError) {
      this.logger.error(
        `Failed to mark mentor payout as failed for session ${sessionId}`,
        markError instanceof Error ? markError.stack : markError,
      );
    }
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

  private sessionReferenceId(sessionId: number) {
    return `session:${sessionId}`;
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
