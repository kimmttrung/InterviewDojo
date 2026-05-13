import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Messages } from '@/common/constants/messages.constant';
import { QueryBookingDto } from './dto/query-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import {
  BookingListResponse,
  BookingItem,
} from './interfaces/booking-list.interface';
import { BookingDetail } from './interfaces/booking-detail.interface';
import { splitSlotIfNeeded } from './helpers/slot-split.helper';

@Injectable()
export class MentorBookingService {
  constructor(private prisma: PrismaService) {}

  private async ensureMentorActive(mentorId: number) {
    const mentor = await this.prisma.user.findFirst({
      where: {
        id: mentorId,
        status: 'ACTIVE',
        mentorProfile: { approvalStatus: 'ACTIVE' },
      },
    });
    if (!mentor) {
      throw new ForbiddenException(Messages.MENTOR_BOOKING.MENTOR_NOT_ACTIVE);
    }
  }

  async getBookings(
    mentorId: number,
    query: QueryBookingDto,
  ): Promise<BookingListResponse> {
    await this.ensureMentorActive(mentorId);
    const { status, page, limit } = query; // page, limit đã có default trong DTO
    const skip = (page - 1) * limit;

    const where = { mentorId, ...(status && { status }) };
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          slot: true,
          coachingPlan: {
            select: { id: true, title: true, duration: true, price: true },
          },
          candidate: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          answers: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    const items: BookingItem[] = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      slot: {
        id: b.slot.id,
        startTime: b.slot.startTime.toISOString(),
        endTime: b.slot.endTime.toISOString(),
        status: b.slot.status,
      },
      coachingPlan: {
        id: b.coachingPlan.id,
        title: b.coachingPlan.title,
        duration: b.coachingPlan.duration,
        price: b.coachingPlan.price,
      },
      candidate: {
        id: b.candidate.id,
        name: b.candidate.name || '',
        email: b.candidate.email,
        avatarUrl: b.candidate.avatarUrl,
      },
      messageFromCandidate: b.answers[0]?.answerText ?? null,
    }));

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

  async getBookingDetail(
    mentorId: number,
    bookingId: number,
  ): Promise<BookingDetail> {
    await this.ensureMentorActive(mentorId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, mentorId },
      include: {
        slot: true,
        coachingPlan: true,
        candidate: {
          include: { skills: { include: { skill: true } } },
        },
        answers: { include: { question: true } },
      },
    });
    if (!booking)
      throw new NotFoundException(Messages.MENTOR_BOOKING.NOT_FOUND);

    return {
      id: booking.id,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      slot: {
        id: booking.slot.id,
        startTime: booking.slot.startTime.toISOString(),
        endTime: booking.slot.endTime.toISOString(),
        status: booking.slot.status,
      },
      coachingPlan: {
        id: booking.coachingPlan.id,
        title: booking.coachingPlan.title,
        duration: booking.coachingPlan.duration,
        price: booking.coachingPlan.price,
      },
      candidate: {
        id: booking.candidate.id,
        name: booking.candidate.name || '',
        email: booking.candidate.email,
        avatarUrl: booking.candidate.avatarUrl,
      },
      candidateBio: booking.candidate.bio ?? null,
      candidateSkills: booking.candidate.skills.map((s) => ({
        name: s.skill.name,
        level: s.level,
      })),
      coachingPlanDescription: booking.coachingPlan.description ?? null,
      answers: booking.answers.map((a) => ({
        question: a.question.question,
        answerText: a.answerText,
        fileUrl: a.fileUrl,
      })),
      messageFromCandidate: booking.answers[0]?.answerText ?? null,
    };
  }

  async acceptBooking(mentorId: number, bookingId: number) {
    await this.ensureMentorActive(mentorId);
    return await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, mentorId },
        include: { slot: true },
      });
      if (!booking || booking.mentorId !== mentorId)
        throw new NotFoundException(Messages.MENTOR_BOOKING.NOT_FOUND);
      if (booking.status !== 'PENDING')
        throw new BadRequestException(Messages.MENTOR_BOOKING.INVALID_STATUS);
      if (booking.slot.status !== 'AVAILABLE')
        throw new BadRequestException(Messages.MENTOR_BOOKING.SLOT_UNAVAILABLE);

      // Gọi helper với transaction client
      const updatedSlot = await splitSlotIfNeeded(
        tx, // tx có kiểu tương thích
        booking.slot,
        booking.startTime, // Không phải booking.slot.startTime
        booking.endTime,
        booking.id,
      );

      // Cập nhật booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ACCEPTED',
          slotId: updatedSlot.id,
        },
      });

      // Tạo mock session
      await tx.mockSession.create({
        data: {
          bookingId: updatedBooking.id,
          intervieweeId: booking.candidateId,
          scheduledAt: updatedSlot.startTime,
          durationMinutes: booking.snapshotPlanDuration || 30,
          status: 'SCHEDULED',
          source: 'MENTOR_BOOKING',
          mode: 'MEET',
        },
      });

      await tx.bookingActionLog.create({
        data: {
          bookingId,
          actorId: mentorId,
          statusBefore: 'PENDING',
          statusAfter: 'ACCEPTED',
          action: 'ACCEPT',
        },
      });

      return updatedBooking;
    });
  }

  async rejectBooking(
    mentorId: number,
    bookingId: number,
    dto: RejectBookingDto,
  ) {
    await this.ensureMentorActive(mentorId);
    return await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, mentorId },
        include: { slot: true },
      });
      if (!booking)
        throw new NotFoundException(Messages.MENTOR_BOOKING.NOT_FOUND);
      if (booking.status !== 'PENDING')
        throw new BadRequestException(Messages.MENTOR_BOOKING.INVALID_STATUS);

      // 1. Hoàn tiền cho Candidate (Credit Balance)
      await tx.user.update({
        where: { id: booking.candidateId },
        data: {
          creditBalance: { increment: booking.snapshotPlanPrice ?? 0 },
        },
      });

      // 2. Mở lại Slot status thành AVAILABLE
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE' },
      });

      // 3. Cập nhật trạng thái Booking sang REJECTED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'REJECTED' },
      });

      await tx.bookingActionLog.create({
        data: {
          bookingId,
          actorId: mentorId,
          statusBefore: 'PENDING',
          statusAfter: 'REJECTED',
          action: 'REJECT',
          note: dto.reason,
        },
      });

      return updatedBooking;
    });
  }
}
