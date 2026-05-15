// features/mentor/bookings/services/booking.service.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

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

export const bookingService = {
  // Lấy danh sách booking (cho mentor hoặc candidate)
  getMentorBookings: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsResponse> => {
    const response = await api.get(API_ENDPOINT.BOOKING.GET_ALL, { params });
    return response.data.data;
  },

  // Accept booking
  acceptBooking: async (bookingId: number): Promise<Booking> => {
    const response = await api.patch(API_ENDPOINT.BOOKING.ACCEPT(bookingId));
    return response.data.data;
  },

  // Reject booking (có thể kèm lý do)
  rejectBooking: async (bookingId: number, reason?: string): Promise<Booking> => {
    const response = await api.patch(API_ENDPOINT.BOOKING.REJECT(bookingId), { reason });
    return response.data.data;
  },

  // Lấy chi tiết một booking
  getBookingDetail: async (bookingId: number): Promise<Booking> => {
    const response = await api.get(API_ENDPOINT.BOOKING.GET_ONE(bookingId));
    return response.data.data;
  },

  // Thanh toán booking (nếu cần)
  payBooking: async (bookingId: number, method: string): Promise<Booking> => {
    const response = await api.post(API_ENDPOINT.BOOKING.PAY(bookingId), { method });
    return response.data.data;
  },
};
