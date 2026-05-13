// helpers/slot-split.helper.ts
import { Prisma, Slot } from '@prisma/client';

export async function splitSlotIfNeeded(
  prisma: Prisma.TransactionClient,
  originalSlot: Slot,
  bookingStart: Date,
  bookingEnd: Date,
  bookingId: number,
) {
  // 1. Kiểm tra xem booking có khít hoàn toàn với slot không
  const isFullSlot =
    originalSlot.startTime.getTime() === bookingStart.getTime() &&
    originalSlot.endTime.getTime() === bookingEnd.getTime();

  if (isFullSlot) {
    return await prisma.slot.update({
      where: { id: originalSlot.id },
      data: { status: 'BLOCKED' },
    });
  }

  // 2. Nếu không khít, tiến hành tách slot
  // Tạo slot đã được đặt (đây là slot sẽ trả về cho Booking)
  const bookedSlot = await prisma.slot.create({
    data: {
      mentorId: originalSlot.mentorId,
      startTime: bookingStart,
      endTime: bookingEnd,
      status: 'BLOCKED',
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
    },
  });

  const remainingSlots: Prisma.SlotCreateManyInput[] = [];

  // Khoảng trống phía trước (ví dụ 6h00 - 6h20)
  if (originalSlot.startTime < bookingStart) {
    remainingSlots.push({
      mentorId: originalSlot.mentorId,
      startTime: originalSlot.startTime,
      endTime: bookingStart,
      status: 'AVAILABLE',
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
    });
  }

  // Khoảng trống phía sau (ví dụ 6h50 - 9h00)
  if (originalSlot.endTime > bookingEnd) {
    remainingSlots.push({
      mentorId: originalSlot.mentorId,
      startTime: bookingEnd,
      endTime: originalSlot.endTime,
      status: 'AVAILABLE',
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
    });
  }

  if (remainingSlots.length > 0) {
    await prisma.slot.createMany({ data: remainingSlots });
  }

  // 3. Xóa slot cha (slot 6h-9h ban đầu)
  await prisma.slot.delete({ where: { id: originalSlot.id } });

  return bookedSlot;
}
