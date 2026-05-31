// features/mentor/bookings/types/index.ts
export interface Booking {
  id: number;
  slotId: number;
  mentorId: number;
  candidateId: number;
  coachingPlanId: number;
  startTime: string;
  endTime: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PENDING_ACCEPTANCE'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'EXPIRED'
    | 'REFUNDED';
  createdAt: string;
  holdExpiresAt?: string;
  mentorResponseDeadline?: string;
  planDetails: {
    title: string;
    price: number;
    duration: number;
    description?: string;
  };
  candidate: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  mentor: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface BookingsResponse {
  items: Booking[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateBookingStatusPayload {
  status: string;
  reason?: string;
}
