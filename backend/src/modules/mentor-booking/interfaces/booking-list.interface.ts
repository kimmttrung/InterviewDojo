import { BookingStatus, SlotStatus } from '@prisma/client';

// booking-list.interface.ts
export interface BookingItem {
  id: number;
  status: BookingStatus;
  createdAt: string;
  slot: {
    id: number;
    startTime: string;
    endTime: string;
    status: SlotStatus;
  };
  coachingPlan: {
    id: number;
    title: string;
    duration: number;
    price: number;
  };
  candidate: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  messageFromCandidate: string | null; // cho phép null
}

export interface BookingListResponse {
  items: BookingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
