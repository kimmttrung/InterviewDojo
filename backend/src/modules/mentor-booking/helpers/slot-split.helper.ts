// slot-split.helper.ts
import { Prisma, Slot } from '@prisma/client';

export async function splitSlotIfNeeded(
  prisma: Prisma.TransactionClient,
  originalSlot: Slot,
  bookingStart: Date,
  bookingEnd: Date,
  bookingId: number,
) {
  const isFullSlot =
    originalSlot.startTime.getTime() === bookingStart.getTime() &&
    originalSlot.endTime.getTime() === bookingEnd.getTime();

  if (isFullSlot) {
    return await prisma.slot.update({
      where: { id: originalSlot.id },
      data: { status: 'BLOCKED' },
    });
  }

  const newSlots: Prisma.SlotCreateManyInput[] = []; // ✅ explicit type

  if (originalSlot.startTime < bookingStart) {
    newSlots.push({
      mentorId: originalSlot.mentorId,
      startTime: originalSlot.startTime,
      endTime: bookingStart,
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
      status: 'AVAILABLE',
    });
  }

  const bookedSlot = await prisma.slot.create({
    data: {
      mentorId: originalSlot.mentorId,
      startTime: bookingStart,
      endTime: bookingEnd,
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
      status: 'BLOCKED',
      booking: { connect: { id: bookingId } },
    },
  });

  if (originalSlot.endTime > bookingEnd) {
    newSlots.push({
      mentorId: originalSlot.mentorId,
      startTime: bookingEnd,
      endTime: originalSlot.endTime,
      recurrentType: originalSlot.recurrentType,
      recurrentUntil: originalSlot.recurrentUntil,
      status: 'AVAILABLE',
    });
  }

  if (newSlots.length) {
    await prisma.slot.createMany({ data: newSlots });
  }

  await prisma.slot.delete({ where: { id: originalSlot.id } });

  return bookedSlot;
}
