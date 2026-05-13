export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY';

export interface Slot {
  id: number;
  mentorId: number;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  recurrence?: RecurrenceType;
  recurrenceEndDate?: Date;
  bookingInfo?: {
    candidateName: string;
    planName: string; // Tên Coaching Plan (VD: Sửa CV 1-1)
  };
}

export interface MentorStatus {
  isApproved: boolean;
  isActive: boolean;
}
