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
  // create v1
  // async create(mentorId: number, data: CreateSlotDto): Promise<SlotResponse> {
  //   const slot = await this.prisma.slot.create({
  //     data: {
  //       mentorId,
  //       startTime: new Date(data.startTime),
  //       endTime: new Date(data.endTime),
  //       status: SlotStatus.AVAILABLE,
  //     },
  //   });
  //   return this.mapToSlotResponse(slot);
  // }

  // async createBatch(
  //   mentorId: number,
  //   data: CreateBatchSlotDto,
  // ): Promise<BatchPayloadResponse> {
  //   const slotsData = data.slots.map((slot) => ({
  //     mentorId,
  //     startTime: new Date(slot.startTime),
  //     endTime: new Date(slot.endTime),
  //     status: SlotStatus.AVAILABLE,
  //   }));

  //   const result = await this.prisma.slot.createMany({
  //     data: slotsData,
  //     skipDuplicates: true,
  //   });

  //   return { count: result.count };
  // }

  // update slot + logic lặp lịch v2
  // async update(
  //   id: number,
  //   mentorId: number,
  //   data: UpdateSlotDto,
  // ): Promise<SlotResponse> {
  //   try {
  //     await this.ensureMentorIsActive(mentorId);
  //     console.log('--- START UPDATE SLOT ---');
  //     console.log('1. Payload gửi lên:', data);

  //     const slot = await this.prisma.slot.findUnique({ where: { id } });

  //     if (!slot || slot.mentorId !== mentorId) {
  //       console.log('2. LỖI: Không tìm thấy Slot hoặc sai Mentor');
  //       throw new NotFoundException(Messages.SLOT.NOT_FOUND);
  //     }
  //     if (slot.status !== SlotStatus.AVAILABLE) {
  //       console.log('2. LỖI: Trạng thái Slot không hợp lệ');
  //       throw new BadRequestException(Messages.SLOT.INVALID_STATUS);
  //     }

  //     console.log('3. Đang cập nhật Slot gốc...');
  //     // 1. Cập nhật slot gốc (Base slot)
  //     const updatedSlot = await this.prisma.slot.update({
  //       where: { id },
  //       data: {
  //         startTime: data.startTime ? new Date(data.startTime) : undefined,
  //         endTime: data.endTime ? new Date(data.endTime) : undefined,
  //       },
  //     });
  //     console.log('4. Đã cập nhật xong Slot gốc, ID:', updatedSlot.id);

  //     // 2. Logic Lặp lịch
  //     if (
  //       data.recurrence &&
  //       (data.recurrence === 'WEEKLY' || data.recurrence === 'MONTHLY') &&
  //       data.recurrenceEndDate
  //     ) {
  //       console.log('5. Bắt đầu tính toán các slot lặp...');
  //       const endDate = new Date(data.recurrenceEndDate);
  //       endDate.setHours(23, 59, 59, 999);

  //       // Khai báo chuẩn TypeScript
  //       const newSlotsData: {
  //         mentorId: number;
  //         startTime: Date;
  //         endTime: Date;
  //         status: SlotStatus;
  //       }[] = [];

  //       const currentStartTime = new Date(updatedSlot.startTime);
  //       const currentEndTime = new Date(updatedSlot.endTime);

  //       let safeguard = 0;

  //       while (safeguard < 100) {
  //         safeguard++;

  //         if (data.recurrence === 'WEEKLY') {
  //           currentStartTime.setDate(currentStartTime.getDate() + 7);
  //           currentEndTime.setDate(currentEndTime.getDate() + 7);
  //         } else if (data.recurrence === 'MONTHLY') {
  //           currentStartTime.setMonth(currentStartTime.getMonth() + 1);
  //           currentEndTime.setMonth(currentEndTime.getMonth() + 1);
  //         }

  //         if (currentStartTime > endDate) {
  //           console.log('-> Đã vượt qua ngày kết thúc lặp. Dừng vòng lặp.');
  //           break;
  //         }

  //         newSlotsData.push({
  //           mentorId: mentorId,
  //           startTime: new Date(currentStartTime),
  //           endTime: new Date(currentEndTime),
  //           status: SlotStatus.AVAILABLE,
  //         });
  //       }

  //       console.log(
  //         `6. Chuẩn bị Insert ${newSlotsData.length} slots mới vào Database.`,
  //       );

  //       // Insert dữ liệu
  //       if (newSlotsData.length > 0) {
  //         await this.prisma.slot.createMany({
  //           data: newSlotsData,
  //           // XÓA DÒNG BÊN DƯỚI NẾU BẠN ĐANG DÙNG SQLITE:
  //           // skipDuplicates: true,
  //         });
  //         console.log('7. ĐÃ INSERT BATCH THÀNH CÔNG VÀO DB!');
  //       }
  //     } else {
  //       console.log('5. Bỏ qua lặp lịch (không thỏa mãn điều kiện IF).');
  //     }

  //     console.log('--- END UPDATE SLOT ---');
  //     return this.mapToSlotResponse(updatedSlot);
  //   } catch (error: any) {
  //     // ÉP LỖI BẮT BUỘC PHẢI IN RA TERMINAL
  //     console.error('🔥 LỖI NGHIÊM TRỌNG TRONG HÀM UPDATE:', error);

  //     // Chuyển lỗi 500 thành 400 để bắn chi tiết lỗi về trình duyệt cho dễ nhìn
  //     throw new BadRequestException(
  //       error.message ||
  //         'Lỗi không xác định khi lưu lịch. Vui lòng xem Terminal.',
  //     );
  //   }
  // }

  // update slot + logic lặp lịch + chống trùng slot v3

  //create v2 : chống trùng lịch
  async create(mentorId: number, data: CreateSlotDto): Promise<SlotResponse> {
    await this.ensureMentorIsActive(mentorId);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // KIỂM TRA TRÙNG LỊCH
    const isOverlap = await this.prisma.slot.findFirst({
      where: {
        mentorId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (isOverlap) {
      throw new BadRequestException(
        'Khung giờ bạn tạo đã bị trùng với một lịch khác!',
      );
    }

    const slot = await this.prisma.slot.create({
      data: {
        mentorId,
        startTime: start,
        endTime: end,
        status: SlotStatus.AVAILABLE,
      },
    });
    return this.mapToSlotResponse(slot);
  }

  async createBatch(
    mentorId: number,
    data: CreateBatchSlotDto,
  ): Promise<BatchPayloadResponse> {
    await this.ensureMentorIsActive(mentorId);

    // Lấy toàn bộ lịch tương lai để đối chiếu
    const existingSlots = await this.prisma.slot.findMany({
      where: { mentorId, startTime: { gte: new Date() } },
    });

    const validSlotsData: any[] = [];

    for (const slot of data.slots) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      // Check xem có bị đè lên lịch cũ trong DB không
      const isDbOverlap = existingSlots.some(
        (existing) =>
          existing.startTime.getTime() < end.getTime() &&
          existing.endTime.getTime() > start.getTime(),
      );

      // Nếu không trùng, mới cho phép insert
      if (!isDbOverlap) {
        validSlotsData.push({
          mentorId,
          startTime: start,
          endTime: end,
          status: SlotStatus.AVAILABLE,
        });
      }
    }

    if (validSlotsData.length === 0) {
      throw new BadRequestException('Tất cả khung giờ bạn chọn đều bị trùng!');
    }

    const result = await this.prisma.slot.createMany({
      data: validSlotsData,
      // skipDuplicates: true, // Xóa nếu dùng SQLite
    });

    return { count: result.count };
  }

  async update(
    id: number,
    mentorId: number,
    data: UpdateSlotDto,
  ): Promise<SlotResponse> {
    try {
      // [AC 1 & 2]: Chốt chặn trạng thái Mentor
      await this.ensureMentorIsActive(mentorId);

      console.log('--- START UPDATE SLOT ---');
      console.log('1. Payload gửi lên:', data);

      const slot = await this.prisma.slot.findUnique({ where: { id } });

      if (!slot || slot.mentorId !== mentorId) {
        console.log('2. LỖI: Không tìm thấy Slot hoặc sai Mentor');
        throw new NotFoundException(Messages.SLOT.NOT_FOUND);
      }
      if (slot.status !== SlotStatus.AVAILABLE) {
        console.log('2. LỖI: Trạng thái Slot không hợp lệ');
        throw new BadRequestException(Messages.SLOT.INVALID_STATUS);
      }

      // [AC 3.1]: Kiểm tra trùng lịch cho chính việc sửa Slot Gốc
      if (data.startTime && data.endTime) {
        const newStart = new Date(data.startTime);
        const newEnd = new Date(data.endTime);

        const isBaseOverlap = await this.prisma.slot.findFirst({
          where: {
            mentorId,
            id: { not: id }, // Bỏ qua chính slot đang sửa
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });

        if (isBaseOverlap) {
          throw new BadRequestException(
            'Khung giờ bạn sửa đã bị trùng với một lịch khác của bạn!',
          );
        }
      }

      console.log('3. Đang cập nhật Slot gốc...');
      // 1. Cập nhật slot gốc (Base slot)
      const updatedSlot = await this.prisma.slot.update({
        where: { id },
        data: {
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        },
      });
      console.log('4. Đã cập nhật xong Slot gốc, ID:', updatedSlot.id);

      // 2. Logic Lặp lịch an toàn
      if (
        data.recurrence &&
        (data.recurrence === 'WEEKLY' || data.recurrence === 'MONTHLY') &&
        data.recurrenceEndDate
      ) {
        console.log('5. Bắt đầu tính toán các slot lặp...');
        const endDate = new Date(data.recurrenceEndDate);
        endDate.setHours(23, 59, 59, 999);

        // [AC 3.2]: Lấy toàn bộ lịch tương lai của Mentor để đối chiếu
        const futureSlots = await this.prisma.slot.findMany({
          where: { mentorId, startTime: { gte: new Date() } },
        });

        const newSlotsData: {
          mentorId: number;
          startTime: Date;
          endTime: Date;
          status: SlotStatus;
        }[] = [];

        // Nên dùng let để tính toán ngày tháng an toàn
        let currentStartTime = new Date(updatedSlot.startTime);
        let currentEndTime = new Date(updatedSlot.endTime);

        let safeguard = 0;

        while (safeguard < 100) {
          safeguard++;

          // Tăng thời gian (Tạo bản sao mới để không bị lỗi tham chiếu)
          if (data.recurrence === 'WEEKLY') {
            currentStartTime = new Date(
              currentStartTime.setDate(currentStartTime.getDate() + 7),
            );
            currentEndTime = new Date(
              currentEndTime.setDate(currentEndTime.getDate() + 7),
            );
          } else if (data.recurrence === 'MONTHLY') {
            currentStartTime = new Date(
              currentStartTime.setMonth(currentStartTime.getMonth() + 1),
            );
            currentEndTime = new Date(
              currentEndTime.setMonth(currentEndTime.getMonth() + 1),
            );
          }

          if (currentStartTime > endDate) {
            console.log('-> Đã vượt qua ngày kết thúc lặp. Dừng vòng lặp.');
            break;
          }

          // Kiểm tra TRÙNG LỊCH: Xem slot mới sinh ra có đè lên slot nào có sẵn không
          const isOverlap = futureSlots.some(
            (existing) =>
              existing.startTime < currentEndTime &&
              existing.endTime > currentStartTime,
          );

          if (!isOverlap) {
            newSlotsData.push({
              mentorId: mentorId,
              startTime: new Date(currentStartTime),
              endTime: new Date(currentEndTime),
              status: SlotStatus.AVAILABLE,
            });
          } else {
            console.log(
              `-> Slot lúc ${currentStartTime.toISOString()} bị trùng lịch! Đã bỏ qua.`,
            );
          }
        }

        console.log(
          `6. Chuẩn bị Insert ${newSlotsData.length} slots mới vào Database.`,
        );

        if (newSlotsData.length > 0) {
          await this.prisma.slot.createMany({
            data: newSlotsData,
            // skipDuplicates: true, // Nhớ xoá/comment dòng này nếu dùng SQLite
          });
          console.log('7. ĐÃ INSERT BATCH THÀNH CÔNG VÀO DB!');
        }
      } else {
        console.log('5. Bỏ qua lặp lịch (không thỏa mãn điều kiện IF).');
      }

      console.log('--- END UPDATE SLOT ---');
      return this.mapToSlotResponse(updatedSlot);
    } catch (error: any) {
      console.error('🔥 LỖI NGHIÊM TRỌNG TRONG HÀM UPDATE:', error);
      throw new BadRequestException(
        error.message ||
          'Lỗi không xác định khi lưu lịch. Vui lòng xem Terminal.',
      );
    }
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

  private async ensureMentorIsActive(mentorId: number) {
    const mentor = await this.prisma.user.findUnique({
      // Hoặc mentorProfile
      where: { id: mentorId },
      select: { status: true }, // Hoặc approvalStatus
    });

    if (!mentor || mentor.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tài khoản của bạn chưa được duyệt hoặc đang bị khóa. Bạn không thể thao tác với Lịch.',
      );
    }
  }
}
