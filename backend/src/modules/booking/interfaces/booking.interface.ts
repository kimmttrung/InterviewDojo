// src/modules/booking/interfaces/booking.interface.ts
export interface BookingResponse {
  id: number;
  slotId: number | null;
  mentorId: number;
  candidateId: number;
  coachingPlanId: number;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
  holdExpiresAt?: Date;
  mentorResponseDeadline?: Date;
  planDetails?: {
    title: string;
    price: number;
    duration: number;
    description?: string;
  };
  candidate?: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  mentor?: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}
