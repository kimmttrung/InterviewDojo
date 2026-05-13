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
      startTime: booking.startTime, // Mapping dữ liệu mới
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

  async create(
    candidateId: number,
    data: CreateBookingDto,
  ): Promise<BookingResponse> {
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findFirst({
        where: {
          id: data.slotId,
          status: SlotStatus.AVAILABLE,
        },
      });

      if (!slot) {
        throw new BadRequestException(Messages.BOOKING.SLOT_UNAVAILABLE);
      }

      // Kiểm tra thời gian booking gửi lên có nằm trong khoảng của Slot không
      const bStart = new Date(data.startTime);
      const bEnd = new Date(data.endTime);
      if (bStart < slot.startTime || bEnd > slot.endTime) {
        throw new BadRequestException(
          'Thời gian chọn nằm ngoài khung giờ của Mentor',
        );
      }

      const plan = await tx.coachingPlan.findUnique({
        where: {
          id: data.coachingPlanId,
        },
      });

      if (!plan || !plan.isActive || plan.mentorId !== slot.mentorId) {
        throw new BadRequestException(Messages.BOOKING.PLAN_NOT_FOUND);
      }

      const candidate = await tx.user.findUnique({
        where: {
          id: candidateId,
        },
        select: {
          creditBalance: true,
        },
      });

      if (!candidate || candidate.creditBalance < plan.price) {
        throw new BadRequestException(Messages.BOOKING.NOT_ENOUGH_CREDIT);
      }

      await tx.user.update({
        where: {
          id: candidateId,
        },
        data: {
          creditBalance: {
            decrement: plan.price,
          },
        },
      });

      const booking = await tx.booking.create({
        data: {
          candidateId,
          mentorId: slot.mentorId,
          slotId: data.slotId,
          coachingPlanId: plan.id,
          status: BookingStatus.PENDING,
          startTime: bStart, // LƯU VÀO DB
          endTime: bEnd, // LƯU VÀO DB
          snapshotPlanTitle: plan.title,
          snapshotPlanDescription: plan.description,
          snapshotPlanPrice: plan.price,
          snapshotPlanDuration: plan.duration,

          answers: data.answers?.length
            ? {
                create: data.answers.map((answer) => ({
                  questionId: answer.questionId,
                  answerText: answer.answerText,
                  fileUrl: answer.fileUrl,
                })),
              }
            : undefined,
        },
        include: {
          coachingPlan: true,
        },
      });

      await tx.slot.update({
        where: {
          id: data.slotId,
        },
        data: {
          status: SlotStatus.BLOCKED,
        },
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

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking này đã được xử lý trước đó');
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.status === BookingStatus.REJECTED) {
        await tx.user.update({
          where: {
            id: booking.candidateId,
          },
          data: {
            creditBalance: {
              increment: booking.snapshotPlanPrice ?? 0,
            },
          },
        });

        await tx.slot.update({
          where: {
            id: booking.slotId,
          },
          data: {
            status: SlotStatus.AVAILABLE,
          },
        });
      }

      if (data.status === BookingStatus.ACCEPTED) {
        await tx.slot.update({
          where: {
            id: booking.slotId,
          },
          data: {
            status: SlotStatus.BOOKED,
          },
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
