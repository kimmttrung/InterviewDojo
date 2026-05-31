import { SlotRecurrentType } from '@prisma/client';

export interface SlotResponse {
  id: number;
  mentorId: number;

  startTime: Date;
  endTime: Date;

  isActive: boolean;

  recurrentType: SlotRecurrentType;
  recurrentUntil: Date | null;

  createdAt: Date;
}
