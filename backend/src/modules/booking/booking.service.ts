// src/modules/booking/booking.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBookingDto,
  QueryBookingDto,
  UpdateBookingStatusDto,
  PaymentDto,
} from './dto/booking.dto';
import { BookingResponse } from './interfaces/booking.interface';
import { Messages } from '../../common/constants/messages.constant';
import {
  Role,
  BookingStatus,
  PaymentStatus,
  WalletTransactionType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  private mapToBookingResponse(booking: any): BookingResponse {
    return {
      id: booking.id,
      slotId: booking.slotId,
      mentorId: booking.mentorId,
      candidateId: booking.candidateId,
      coachingPlanId: booking.coachingPlanId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      createdAt: booking.createdAt,
      holdExpiresAt: booking.holdExpiresAt,
      mentorResponseDeadline: booking.mentorResponseDeadline,
      planDetails: booking.coachingPlan
        ? {
            title: booking.coachingPlan.title,
            price: booking.coachingPlan.price,
            duration: booking.coachingPlan.duration,
            description: booking.coachingPlan.description,
          }
        : undefined,
      candidate: booking.candidate
        ? {
            id: booking.candidate.id,
            name: booking.candidate.name,
            email: booking.candidate.email,
            avatarUrl: booking.candidate.avatarUrl,
          }
        : undefined,
      mentor: booking.mentor
        ? {
            id: booking.mentor.id,
            name: booking.mentor.name,
            email: booking.mentor.email,
            avatarUrl: booking.mentor.avatarUrl,
          }
        : undefined,
    };
  }

  async create(
    candidateId: number,
    dto: CreateBookingDto,
  ): Promise<BookingResponse> {
    const { coachingPlanId, startTime, endTime, answers } = dto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('startTime phải trước endTime');
    }

    if (start < new Date()) {
      throw new BadRequestException('Không thể đặt lịch trong quá khứ');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Lấy coaching plan
        const plan = await tx.coachingPlan.findUnique({
          where: { id: coachingPlanId },
          include: {
            mentor: true,
          },
        });

        if (!plan || !plan.isActive) {
          throw new BadRequestException(Messages.BOOKING.PLAN_NOT_FOUND);
        }

        const mentorId = plan.mentor.userId;

        // 2. Validate duration
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        if (durationMinutes !== plan.duration) {
          throw new BadRequestException('Duration không khớp coaching plan');
        }

        // 3. Resolve slot
        const slot = await tx.slot.findFirst({
          where: {
            mentorId,
            isActive: true,
            startTime: {
              lte: start,
            },
            endTime: {
              gte: end,
            },
          },
        });

        if (!slot) {
          throw new BadRequestException(Messages.BOOKING.SLOT_UNAVAILABLE);
        }

        // 4. Check overlap booking
        const conflicting = await tx.booking.findFirst({
          where: {
            mentorId,

            OR: [
              {
                status: {
                  in: [
                    BookingStatus.PENDING_ACCEPTANCE,
                    BookingStatus.ACCEPTED,
                  ],
                },
              },
              {
                status: BookingStatus.PENDING_PAYMENT,
                holdExpiresAt: {
                  gt: new Date(),
                },
              },
            ],

            startTime: {
              lt: end,
            },

            endTime: {
              gt: start,
            },
          },
        });

        if (conflicting) {
          throw new BadRequestException(Messages.BOOKING.SLOT_UNAVAILABLE);
        }

        // 5. Create booking
        const booking = await tx.booking.create({
          data: {
            candidateId,
            mentorId,

            slotId: slot.id,

            coachingPlanId,

            startTime: start,
            endTime: end,

            status: BookingStatus.PENDING_PAYMENT,

            holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000),

            snapshotPlanTitle: plan.title,
            snapshotPlanDescription: plan.description,
            snapshotPlanPrice: plan.price,
            snapshotPlanDuration: plan.duration,

            answers: answers?.length
              ? {
                  create: answers.map((a) => ({
                    questionId: a.questionId,
                    answerText: a.answerText,
                    fileUrl: a.fileUrl,
                  })),
                }
              : undefined,
          },

          include: {
            coachingPlan: true,

            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });

        return this.mapToBookingResponse(booking);
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async payWithWallet(
    bookingId: number,
    candidateId: number,
  ): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { candidate: true },
      });
      if (!booking || booking.candidateId !== candidateId) {
        throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          'Booking không ở trạng thái chờ thanh toán',
        );
      }
      if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
        throw new BadRequestException('Booking đã hết hạn thanh toán');
      }

      const price = booking.snapshotPlanPrice;
      if (!price) throw new BadRequestException('Giá không xác định');

      const user = await tx.user.findUnique({ where: { id: candidateId } });
      if (!user || user.creditBalance < price) {
        throw new BadRequestException(Messages.BOOKING.NOT_ENOUGH_CREDIT);
      }

      const newBalance = user.creditBalance - price;
      await tx.user.update({
        where: { id: candidateId },
        data: { creditBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId: candidateId,
          type: WalletTransactionType.PAYMENT,
          amount: -price,
          balanceBefore: user.creditBalance,
          balanceAfter: newBalance,
          referenceId: `booking:${bookingId}`,
        },
      });

      await tx.payment.create({
        data: {
          bookingId,
          amount: price,
          currency: 'VND',
          provider: 'INTERNAL_WALLET',
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_ACCEPTANCE,
          mentorResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: { coachingPlan: true, candidate: true },
      });

      return this.mapToBookingResponse(updatedBooking);
    });
  }

  async accept(bookingId: number, mentorId: number): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.mentorId !== mentorId) {
        throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
        throw new BadRequestException(
          'Chỉ có thể chấp nhận booking ở trạng thái chờ xác nhận',
        );
      }

      // Kiểm tra lại conflict (phòng trường hợp có booking khác vừa được accept)
      const conflicting = await tx.booking.findFirst({
        where: {
          mentorId,
          id: { not: bookingId },
          status: {
            in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.ACCEPTED],
          },
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime },
        },
      });
      if (conflicting) {
        throw new BadRequestException('Khung giờ đã bị trùng với booking khác');
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ACCEPTED },
        include: { coachingPlan: true, candidate: true },
      });

      await tx.bookingActionLog.create({
        data: {
          bookingId,
          actorId: mentorId,
          statusBefore: booking.status,
          statusAfter: BookingStatus.ACCEPTED,
          action: 'ACCEPT',
        },
      });

      return this.mapToBookingResponse(updated);
    });
  }

  async reject(
    bookingId: number,
    mentorId: number,
    reason?: string,
  ): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { candidate: true },
      });
      if (!booking || booking.mentorId !== mentorId) {
        throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
        throw new BadRequestException(
          'Chỉ có thể từ chối booking ở trạng thái chờ xác nhận',
        );
      }

      // Hoàn tiền nếu đã thanh toán (thực tế booking đã được thanh toán trước khi vào PENDING_ACCEPTANCE)
      const price = booking.snapshotPlanPrice;
      if (price) {
        const user = await tx.user.findUnique({
          where: { id: booking.candidateId },
        });
        if (user) {
          const newBalance = user.creditBalance + price;
          await tx.user.update({
            where: { id: booking.candidateId },
            data: { creditBalance: newBalance },
          });
          await tx.walletTransaction.create({
            data: {
              userId: booking.candidateId,
              type: WalletTransactionType.REFUND,
              amount: price,
              balanceBefore: user.creditBalance,
              balanceAfter: newBalance,
              referenceId: `booking:${bookingId}:refund`,
            },
          });
        }
        await tx.payment.updateMany({
          where: { bookingId, status: PaymentStatus.PAID },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
            refundedAmount: price,
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED },
        include: { coachingPlan: true, candidate: true },
      });

      await tx.bookingActionLog.create({
        data: {
          bookingId,
          actorId: mentorId,
          statusBefore: booking.status,
          statusAfter: BookingStatus.REJECTED,
          action: 'REJECT',
          note: reason,
        },
      });

      return this.mapToBookingResponse(updated);
    });
  }

  async findAll(query: QueryBookingDto, currentUser: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (currentUser.role === Role.CANDIDATE) {
      where.candidateId = currentUser.sub;
    } else if (currentUser.role === Role.MENTOR) {
      where.mentorId = currentUser.sub;
    } else if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Không có quyền');
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          coachingPlan: true,
          candidate: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          mentor: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: bookings.map((b) => this.mapToBookingResponse(b)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    bookingId: number,
    currentUser: any,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        coachingPlan: true,
        candidate: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        mentor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!booking) throw new NotFoundException(Messages.BOOKING.NOT_FOUND);

    const isOwner =
      booking.candidateId === currentUser.sub ||
      booking.mentorId === currentUser.sub;
    const isAdmin = currentUser.role === Role.ADMIN;
    if (!isOwner && !isAdmin)
      throw new ForbiddenException(Messages.BOOKING.NOT_FOUND);

    return this.mapToBookingResponse(booking);
  }

  // Giữ lại cho tương thích nếu cần
  async updateStatus(
    bookingId: number,
    mentorId: number,
    dto: UpdateBookingStatusDto,
  ) {
    if (dto.status === BookingStatus.ACCEPTED) {
      return this.accept(bookingId, mentorId);
    } else if (dto.status === BookingStatus.REJECTED) {
      return this.reject(bookingId, mentorId);
    }
    throw new BadRequestException('Chỉ hỗ trợ ACCEPT hoặc REJECT');
  }
}
