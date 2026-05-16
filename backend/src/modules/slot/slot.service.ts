import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSlotDto, UpdateSlotDto, QuerySlotDto } from './dto/slot.dto';
import { SlotResponse } from './interfaces/slot.interfaces';
import { Messages } from '../../common/constants/messages.constant';
import { BookingStatus } from '@prisma/client';
import {
  toUTC,
  toLocal,
  formatLocalDate,
  DEFAULT_TIMEZONE,
} from '../../common/utils/timezone';

@Injectable()
export class SlotService {
  private readonly STEP_MINUTES = 30; // bước nhảy mặc định khi sinh session

  constructor(private prisma: PrismaService) {}

  // ========== CRUD ==========

  private mapToSlotResponse(slot: any): SlotResponse {
    return {
      id: slot.id,
      mentorId: slot.mentorId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
      recurrentType: slot.recurrentType,
      recurrentUntil: slot.recurrentUntil,
      createdAt: slot.createdAt,
    };
  }

  async findAll(
    query: QuerySlotDto,
    currentUser: any,
  ): Promise<SlotResponse[]> {
    const { mentorId, startDate, endDate } = query;
    const targetMentorId =
      currentUser.role === 'MENTOR' ? currentUser.id : mentorId;

    const slots = await this.prisma.slot.findMany({
      where: {
        mentorId: targetMentorId,
        ...(startDate && { startTime: { gte: new Date(startDate) } }),
        ...(endDate && { endTime: { lte: new Date(endDate) } }),
      },
      orderBy: { startTime: 'asc' },
    });
    return slots.map(this.mapToSlotResponse);
  }

  async create(mentorId: number, dto: CreateSlotDto): Promise<SlotResponse> {
    await this.ensureMentorIsActive(mentorId);

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (start >= end)
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    if (start < new Date())
      throw new BadRequestException(
        'Không thể tạo availability trong quá khứ.',
      );

    const overlapping = await this.prisma.slot.findFirst({
      where: {
        mentorId,
        isActive: true,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (overlapping) throw new BadRequestException('Khung giờ bị trùng.');

    const slot = await this.prisma.slot.create({
      data: {
        mentorId,
        startTime: start,
        endTime: end,
        isActive: dto.isActive ?? true,
        recurrentType: dto.recurrentType || 'NONE',
        recurrentUntil: dto.recurrentUntil
          ? new Date(dto.recurrentUntil)
          : null,
      },
    });
    return this.mapToSlotResponse(slot);
  }

  async update(
    id: number,
    mentorId: number,
    dto: UpdateSlotDto,
  ): Promise<SlotResponse> {
    await this.ensureMentorIsActive(mentorId);

    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot || slot.mentorId !== mentorId)
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);

    const newStart = dto.startTime ? new Date(dto.startTime) : slot.startTime;
    const newEnd = dto.endTime ? new Date(dto.endTime) : slot.endTime;
    if (newStart >= newEnd)
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );

    const overlapping = await this.prisma.slot.findFirst({
      where: {
        mentorId,
        id: { not: id },
        isActive: true,
        startTime: { lt: newEnd },
        endTime: { gt: newStart },
      },
    });
    if (overlapping) throw new BadRequestException('Khung giờ sửa bị trùng.');

    const updatedSlot = await this.prisma.slot.update({
      where: { id },
      data: {
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.recurrentType && { recurrentType: dto.recurrentType }),
        ...(dto.recurrentUntil !== undefined && {
          recurrentUntil: dto.recurrentUntil
            ? new Date(dto.recurrentUntil)
            : null,
        }),
      },
    });
    return this.mapToSlotResponse(updatedSlot);
  }

  async remove(id: number, mentorId: number): Promise<SlotResponse> {
    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot || slot.mentorId !== mentorId)
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);
    const deletedSlot = await this.prisma.slot.delete({ where: { id } });
    return this.mapToSlotResponse(deletedSlot);
  }

  // ========== AVAILABILITY (dynamic session generation) ==========

  /**
   * Lấy danh sách ngày có ít nhất một session khả dụng trong tháng.
   */
  async getAvailableDays(mentorId: number, planId: number, month: string) {
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.isActive)
      throw new BadRequestException('Plan không hợp lệ');

    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = toUTC(new Date(year, monthNum - 1, 1, 0, 0, 0));

    const lastDay = toUTC(new Date(year, monthNum, 0, 23, 59, 59));

    // 1 query duy nhất cho tất cả dữ liệu trong tháng
    const [windows, bookings, blockedEvents] = await Promise.all([
      this.prisma.slot.findMany({
        where: {
          mentorId,
          isActive: true,
          startTime: { lte: lastDay },
          endTime: { gte: firstDay },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          mentorId,
          startTime: { lte: lastDay },
          endTime: { gte: firstDay },
          OR: [
            {
              status: BookingStatus.PENDING_PAYMENT,
              holdExpiresAt: { gt: new Date() },
            },
            {
              status: {
                in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.ACCEPTED],
              },
            },
          ],
        },
      }),
      this.prisma.blockedEvent.findMany({
        where: {
          mentorId,
          startTime: { lte: lastDay },
          endTime: { gte: firstDay },
        },
      }),
    ]);

    const occupied = [...bookings, ...blockedEvents];
    const durationMs = plan.duration * 60 * 1000;
    const stepMs = this.STEP_MINUTES * 60 * 1000;

    const availableDays: string[] = [];

    let currentTime = firstDay.getTime();

    while (currentTime <= lastDay.getTime()) {
      const current = new Date(currentTime);

      const zoned = toLocal(current);

      const y = zoned.getFullYear();
      const m = zoned.getMonth();
      const d = zoned.getDate();

      const dayStart = toUTC(new Date(y, m, d, 0, 0, 0));

      const dayEnd = toUTC(new Date(y, m, d, 23, 59, 59));

      const dayWindows = windows.filter(
        (w) => w.startTime < dayEnd && w.endTime > dayStart,
      );

      let hasSlot = false;

      for (const window of dayWindows) {
        let currentSlot = window.startTime.getTime();
        const end = window.endTime.getTime();

        while (currentSlot + durationMs <= end) {
          const sStart = new Date(currentSlot);
          const sEnd = new Date(currentSlot + durationMs);

          const overlap = occupied.some(
            (o) => sStart < o.endTime && sEnd > o.startTime,
          );

          if (!overlap) {
            hasSlot = true;
            break;
          }

          currentSlot += stepMs;
        }

        if (hasSlot) break;
      }

      if (hasSlot) {
        availableDays.push(formatLocalDate(dayStart));
      }

      currentTime += 24 * 60 * 60 * 1000;
    }

    return availableDays;
  }

  /**
   * Lấy danh sách session khả dụng trong một ngày cụ thể.
   */
  async getAvailableSessions(mentorId: number, planId: number, date: string) {
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.isActive)
      throw new BadRequestException('Plan không hợp lệ');

    const [y, m, d] = date.split('-').map(Number);

    const dayStart = toUTC(new Date(y, m - 1, d, 0, 0, 0));

    const dayEnd = toUTC(new Date(y, m - 1, d, 23, 59, 59));

    const [windows, bookings, blockedEvents] = await Promise.all([
      this.prisma.slot.findMany({
        where: {
          mentorId,
          isActive: true,
          startTime: { lte: dayEnd },
          endTime: { gte: dayStart },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          mentorId,
          startTime: { lte: dayEnd },
          endTime: { gte: dayStart },
          OR: [
            {
              status: BookingStatus.PENDING_PAYMENT,
              holdExpiresAt: { gt: new Date() },
            },
            {
              status: {
                in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.ACCEPTED],
              },
            },
          ],
        },
      }),
      this.prisma.blockedEvent.findMany({
        where: {
          mentorId,
          startTime: { lte: dayEnd },
          endTime: { gte: dayStart },
        },
      }),
    ]);

    const occupied = [...bookings, ...blockedEvents];
    const durationMs = plan.duration * 60 * 1000;
    const stepMs = this.STEP_MINUTES * 60 * 1000;

    const sessions: Array<{ startTime: string; endTime: string }> = [];

    for (const window of windows) {
      let current = window.startTime.getTime();
      const end = window.endTime.getTime();
      while (current + durationMs <= end) {
        const sStart = new Date(current);
        const sEnd = new Date(current + durationMs);
        const overlap = occupied.some(
          (o) => sStart < o.endTime && sEnd > o.startTime,
        );
        if (!overlap) {
          sessions.push({
            startTime: sStart.toISOString(),
            endTime: sEnd.toISOString(),
          });
        }
        current += stepMs;
      }
    }

    return sessions;
  }

  // ========== HELPER ==========

  private async ensureMentorIsActive(mentorId: number) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: mentorId },
      select: { status: true },
    });
    if (!mentor || mentor.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tài khoản của bạn chưa được duyệt hoặc bị khóa.',
      );
    }
  }
}
