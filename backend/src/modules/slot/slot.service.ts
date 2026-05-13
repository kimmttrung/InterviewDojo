import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateSlotDto, UpdateSlotDto, QuerySlotDto } from './dto/slot.dto';

import { SlotResponse } from './interfaces/slot.interfaces';

import { Messages } from '../../common/constants/messages.constant';

import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SlotService {
  constructor(private prisma: PrismaService) {}

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
    currentUser: JwtPayload,
  ): Promise<SlotResponse[]> {
    const { mentorId, startDate, endDate } = query;

    if (currentUser.role !== 'MENTOR' && !mentorId) {
      throw new BadRequestException('mentorId là bắt buộc.');
    }

    const targetMentorId =
      currentUser.role === 'MENTOR' ? currentUser.sub : mentorId;

    const slots = await this.prisma.slot.findMany({
      where: {
        mentorId: targetMentorId,

        startTime: startDate ? { gte: new Date(startDate) } : undefined,

        endTime: endDate ? { lte: new Date(endDate) } : undefined,
      },

      orderBy: {
        startTime: 'asc',
      },
    });

    return slots.map((slot) => this.mapToSlotResponse(slot));
  }

  async create(mentorId: number, dto: CreateSlotDto): Promise<SlotResponse> {
    await this.ensureMentorIsActive(mentorId);

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    }

    if (start < new Date()) {
      throw new BadRequestException(
        'Không thể tạo availability trong quá khứ.',
      );
    }

    const overlapping = await this.prisma.slot.findFirst({
      where: {
        mentorId,

        isActive: true,

        startTime: {
          lt: end,
        },

        endTime: {
          gt: start,
        },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Khung giờ bị trùng.');
    }

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

    const slot = await this.prisma.slot.findUnique({
      where: { id },
    });

    if (!slot || slot.mentorId !== mentorId) {
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);
    }

    const newStart = dto.startTime ? new Date(dto.startTime) : slot.startTime;

    const newEnd = dto.endTime ? new Date(dto.endTime) : slot.endTime;

    if (newStart >= newEnd) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    }

    const overlapping = await this.prisma.slot.findFirst({
      where: {
        mentorId,

        id: {
          not: id,
        },

        isActive: true,

        startTime: {
          lt: newEnd,
        },

        endTime: {
          gt: newStart,
        },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Khung giờ sửa bị trùng.');
    }

    const updatedSlot = await this.prisma.slot.update({
      where: {
        id,
      },

      data: {
        ...(dto.startTime && {
          startTime: new Date(dto.startTime),
        }),

        ...(dto.endTime && {
          endTime: new Date(dto.endTime),
        }),

        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),

        ...(dto.recurrentType && {
          recurrentType: dto.recurrentType,
        }),

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
    const slot = await this.prisma.slot.findUnique({
      where: { id },
    });

    if (!slot || slot.mentorId !== mentorId) {
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);
    }

    const deletedSlot = await this.prisma.slot.delete({
      where: { id },
    });

    return this.mapToSlotResponse(deletedSlot);
  }

  private async ensureMentorIsActive(mentorId: number) {
    const mentor = await this.prisma.user.findUnique({
      where: {
        id: mentorId,
      },

      select: {
        status: true,
      },
    });

    if (!mentor || mentor.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tài khoản của bạn chưa được duyệt hoặc bị khóa.',
      );
    }
  }
}
