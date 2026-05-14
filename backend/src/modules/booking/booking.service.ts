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

  // ========== MAPPER ==========
  private mapToBookingResponse(booking: any): BookingResponse {
    return {
      id: booking.id,
      slotId: booking.slotId,
      mentorId: booking.mentorId,
      candidateId: booking.candidateId,
      coachingPlanId: booking.coachingPlanId,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: booking.createdAt,
      planDetails: booking.coachingPlan
        ? {
            title: booking.coachingPlan.title,
            price: booking.coachingPlan.price,
            duration: booking.coachingPlan.duration,
          }
        : undefined,
    };
  }

  // ========== TẠO BOOKING (PENDING_PAYMENT) ==========
  async create(
    candidateId: number,
    data: CreateBookingDto,
  ): Promise<BookingResponse> {
    const { slotId, coachingPlanId, startTime, endTime, answers } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra slot tồn tại và active
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot || !slot.isActive) {
        throw new BadRequestException(Messages.BOOKING.SLOT_UNAVAILABLE);
      }

      // 2. Kiểm tra thời gian booking có nằm trong window không
      const bStart = new Date(startTime);
      const bEnd = new Date(endTime);
      if (bStart < slot.startTime || bEnd > slot.endTime) {
        throw new BadRequestException(
          'Thời gian chọn nằm ngoài khung giờ của Mentor',
        );
      }

      // 3. Kiểm tra plan hợp lệ
      const plan = await tx.coachingPlan.findUnique({
        where: { id: coachingPlanId },
      });
      if (!plan || !plan.isActive || plan.mentorId !== slot.mentorId) {
        throw new BadRequestException(Messages.BOOKING.PLAN_NOT_FOUND);
      }

      // 4. Kiểm tra overlap với các booking đã tồn tại
      const overlapping = await tx.booking.findFirst({
        where: {
          mentorId: slot.mentorId,
          status: {
            in: [
              BookingStatus.PENDING_PAYMENT,
              BookingStatus.PENDING_ACCEPTANCE,
              BookingStatus.ACCEPTED,
            ],
          },
          startTime: { lt: bEnd },
          endTime: { gt: bStart },
        },
      });
      if (overlapping) {
        throw new BadRequestException('Khung giờ đã được đặt');
      }

      // 5. Tạo booking với trạng thái PENDING_PAYMENT
      const booking = await tx.booking.create({
        data: {
          candidateId,
          mentorId: slot.mentorId,
          slotId,
          coachingPlanId: plan.id,
          startTime: bStart,
          endTime: bEnd,
          status: BookingStatus.PENDING_PAYMENT,
          holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
          snapshotPlanTitle: plan.title,
          snapshotPlanDescription: plan.description,
          snapshotPlanPrice: plan.price,
          snapshotPlanDuration: plan.duration,
          answers: answers?.length
            ? {
                create: answers.map((answer) => ({
                  questionId: answer.questionId,
                  answerText: answer.answerText,
                  fileUrl: answer.fileUrl,
                })),
              }
            : undefined,
        },
        include: { coachingPlan: true },
      });

      // TODO: Tạo Redis hold (gọi RedisService)
      // await this.redisService.set(`hold:mentor:${slot.mentorId}:${startTime}:${endTime}`, booking.id, 300);

      return this.mapToBookingResponse(booking);
    });
  }

  // ========== THANH TOÁN (VÍ) ==========
  async pay(bookingId: number, candidateId: number): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
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

      // Kiểm tra số dư
      const user = await tx.user.findUnique({ where: { id: candidateId } });
      if (!user || user.creditBalance < booking.snapshotPlanPrice!) {
        throw new BadRequestException('Số dư không đủ');
      }

      const price = booking.snapshotPlanPrice!;

      // Trừ tiền
      const newBalance = user.creditBalance - price;
      await tx.user.update({
        where: { id: candidateId },
        data: { creditBalance: newBalance },
      });

      // Wallet transaction
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

      // Payment record
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

      // Cập nhật booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_ACCEPTANCE,
          mentorResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
        include: { coachingPlan: true },
      });

      // TODO: Xóa Redis hold
      // await this.redisService.del(`hold:mentor:${booking.mentorId}:${booking.startTime}:${booking.endTime}`);

      return this.mapToBookingResponse(updated);
    });
  }

  // ========== MENTOR ACCEPT ==========
  async accept(bookingId: number, mentorId: number): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.mentorId !== mentorId) {
        throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
        throw new BadRequestException(
          'Booking không ở trạng thái chờ xác nhận',
        );
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ACCEPTED },
        include: { coachingPlan: true },
      });

      return this.mapToBookingResponse(updated);
    });
  }

  // ========== MENTOR REJECT ==========
  async reject(bookingId: number, mentorId: number): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.mentorId !== mentorId) {
        throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
        throw new BadRequestException(
          'Booking không ở trạng thái chờ xác nhận',
        );
      }

      const price = booking.snapshotPlanPrice!;

      // Hoàn tiền cho candidate
      const user = await tx.user.findUnique({
        where: { id: booking.candidateId },
      });
      const newBalance = (user?.creditBalance ?? 0) + price;
      await tx.user.update({
        where: { id: booking.candidateId },
        data: { creditBalance: newBalance },
      });

      // Wallet transaction (refund)
      await tx.walletTransaction.create({
        data: {
          userId: booking.candidateId,
          type: WalletTransactionType.REFUND,
          amount: price,
          balanceBefore: user?.creditBalance ?? 0,
          balanceAfter: newBalance,
          referenceId: `booking:${bookingId}:refund`,
        },
      });

      // Cập nhật payment
      await tx.payment.updateMany({
        where: { bookingId, status: PaymentStatus.PAID },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
          refundedAmount: price,
        },
      });

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED },
        include: { coachingPlan: true },
      });

      return this.mapToBookingResponse(updated);
    });
  }

  // ========== FIND ALL (giữ nguyên) ==========
  async findAll(query: QueryBookingDto, currentUser: any): Promise<any> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { status };

    if (currentUser.role === Role.CANDIDATE) {
      whereCondition.candidateId = currentUser.sub;
    } else if (currentUser.role === Role.MENTOR) {
      whereCondition.mentorId = currentUser.sub;
    }

    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: whereCondition }),
      this.prisma.booking.findMany({
        where: whereCondition,
        include: { coachingPlan: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: bookings.map(this.mapToBookingResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========== FIND BY ID (giữ nguyên) ==========
  async findById(
    bookingId: number,
    currentUser: any,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { coachingPlan: true },
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

  // ========== CẬP NHẬT TRẠNG THÁI (đã được thay bằng accept/reject riêng) ==========
  // Giữ lại để tương thích ngược hoặc xóa sau khi refactor controller.
  async updateStatus(
    bookingId: number,
    mentorId: number,
    data: UpdateBookingStatusDto,
  ): Promise<BookingResponse> {
    // Đơn giản chuyển hướng sang accept hoặc reject dựa trên status mới
    if (data.status === BookingStatus.ACCEPTED) {
      return this.accept(bookingId, mentorId);
    } else if (data.status === BookingStatus.REJECTED) {
      return this.reject(bookingId, mentorId);
    }
    throw new BadRequestException('Trạng thái không hợp lệ');
  }
}
