import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSlotDto,
  CreateBatchSlotDto,
  UpdateSlotDto,
  DeleteBatchSlotDto,
  QuerySlotDto,
} from './dto/slot.dto';
import {
  SlotResponse,
  BatchPayloadResponse,
} from './interfaces/slot.interfaces';
import { Messages } from '../../common/constants/messages.constant';
import { SlotStatus } from '@prisma/client';

@Injectable()
export class SlotService {
  constructor(private prisma: PrismaService) {}

  // Helper function để mapping data ẩn các trường không mong muốn
  private mapToSlotResponse(slot: any): SlotResponse {
    return {
      id: slot.id,
      mentorId: slot.mentorId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      createdAt: slot.createdAt,
    };
  }

  async findAll(
    query: QuerySlotDto,
    currentUser: any,
  ): Promise<SlotResponse[]> {
    const { mentorId, startDate, endDate, status } = query;

    // Logic RBAC: Nếu là Mentor, ép buộc query theo ID của chính họ
    const targetMentorId =
      currentUser.role === 'MENTOR' ? currentUser.id : mentorId;

    const slots = await this.prisma.slot.findMany({
      where: {
        mentorId: targetMentorId,
        status: status,
        startTime: startDate ? { gte: new Date(startDate) } : undefined,
        endTime: endDate ? { lte: new Date(endDate) } : undefined,
      },
      orderBy: { startTime: 'asc' },
    });

    return slots.map(this.mapToSlotResponse);
  }

  async create(mentorId: number, data: CreateSlotDto): Promise<SlotResponse> {
    const slot = await this.prisma.slot.create({
      data: {
        mentorId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: SlotStatus.AVAILABLE,
      },
    });
    return this.mapToSlotResponse(slot);
  }

  async createBatch(
    mentorId: number,
    data: CreateBatchSlotDto,
  ): Promise<BatchPayloadResponse> {
    const slotsData = data.slots.map((slot) => ({
      mentorId,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      status: SlotStatus.AVAILABLE,
    }));

    const result = await this.prisma.slot.createMany({
      data: slotsData,
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  async update(
    id: number,
    mentorId: number,
    data: UpdateSlotDto,
  ): Promise<SlotResponse> {
    const slot = await this.prisma.slot.findUnique({ where: { id } });

    if (!slot || slot.mentorId !== mentorId) {
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);
    }
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new BadRequestException(Messages.SLOT.INVALID_STATUS);
    }

    const updatedSlot = await this.prisma.slot.update({
      where: { id },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
    });

    return this.mapToSlotResponse(updatedSlot);
  }

  async remove(id: number, mentorId: number): Promise<SlotResponse> {
    const slot = await this.prisma.slot.findUnique({ where: { id } });

    if (!slot || slot.mentorId !== mentorId) {
      throw new NotFoundException(Messages.SLOT.NOT_FOUND);
    }
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new BadRequestException(Messages.SLOT.INVALID_STATUS);
    }

    const deletedSlot = await this.prisma.slot.delete({ where: { id } });
    return this.mapToSlotResponse(deletedSlot);
  }

  async removeBatch(
    mentorId: number,
    data: DeleteBatchSlotDto,
  ): Promise<BatchPayloadResponse> {
    const result = await this.prisma.slot.deleteMany({
      where: {
        id: { in: data.slotIds },
        mentorId: mentorId,
        status: SlotStatus.AVAILABLE, // Chốt chặn chỉ xóa slot trống
      },
    });

    return { count: result.count };
  }
}
