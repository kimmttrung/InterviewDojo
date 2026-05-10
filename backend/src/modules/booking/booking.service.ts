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
import { Role, BookingStatus, SlotStatus } from '@prisma/client';

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
      status: booking.status,
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

  async create(
    candidateId: number,
    data: CreateBookingDto,
  ): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Slot có hợp lệ và rảnh không
      const slot = await tx.slot.findUnique({ where: { id: data.slotId } });
      if (!slot || slot.status !== SlotStatus.AVAILABLE) {
        throw new BadRequestException(Messages.BOOKING.SLOT_UNAVAILABLE);
      }

      // 2. Kiểm tra gói dịch vụ có thuộc về Mentor của Slot này và đang active không
      const plan = await tx.coachingPlan.findUnique({
        where: { id: data.coachingPlanId },
      });
      if (!plan || !plan.isActive || plan.mentorId !== slot.mentorId) {
        throw new BadRequestException(Messages.BOOKING.PLAN_NOT_FOUND);
      }

      // 3. Tạo Booking
      const booking = await tx.booking.create({
        data: {
          candidateId,
          mentorId: slot.mentorId,
          slotId: data.slotId,
          coachingPlanId: plan.id,
          status: BookingStatus.PENDING,
        },
        include: { coachingPlan: true },
      });

      // 4. Khóa Slot lại
      await tx.slot.update({
        where: { id: data.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      return this.mapToBookingResponse(booking);
    });
  }

  async findAll(query: QueryBookingDto, currentUser: any): Promise<any> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { status };

    // RBAC
    if (currentUser.role === Role.CANDIDATE) {
      whereCondition.candidateId = currentUser.sub;
    } else if (currentUser.role === Role.MENTOR) {
      whereCondition.mentorId = currentUser.sub;
    }

    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: whereCondition }),
      this.prisma.booking.findMany({
        where: whereCondition,
        include: { coachingPlan: true }, // Nối bảng để lấy detail của Plan
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

  async findById(
    bookingId: number,
    currentUser: any,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { coachingPlan: true },
    });

    if (!booking) {
      throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
    }

    const isOwner =
      booking.candidateId === currentUser.sub ||
      booking.mentorId === currentUser.sub;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(Messages.BOOKING.NOT_FOUND);
    }

    return this.mapToBookingResponse(booking);
  }

  async updateStatus(
    bookingId: number,
    mentorId: number,
    data: UpdateBookingStatusDto,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.mentorId !== mentorId) {
      throw new NotFoundException(Messages.BOOKING.NOT_FOUND);
    }

    return this.prisma.$transaction(async (tx) => {
      // Nếu Mentor HỦY lịch (CANCELLED), nhả Slot đó ra để người khác có thể book lại
      if (data.status === BookingStatus.CANCELLED) {
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: data.status },
        include: { coachingPlan: true },
      });

      return this.mapToBookingResponse(updatedBooking);
    });
  }
}
