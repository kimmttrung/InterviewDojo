// features/mentor/bookings/api/booking.api.ts

import { api } from '@/shared/lib/api';

export const getMentorBookings = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/bookings', { params });
  return response.data.data; // { items: Booking[], meta: {...} }
};

export const acceptBooking = async (bookingId: number) => {
  const response = await api.patch(`/bookings/${bookingId}/accept`);
  return response.data.data;
};

export const rejectBooking = async (bookingId: number, reason?: string) => {
  const response = await api.patch(`/bookings/${bookingId}/reject`, { reason });
  return response.data.data;
};
