// src/features/mentor/schedule/types.ts
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY';

export interface Slot {
  id: number;
  mentorId: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean; // thay cho status
  recurrentType?: RecurrenceType;
  recurrentUntil?: Date | null;
}
