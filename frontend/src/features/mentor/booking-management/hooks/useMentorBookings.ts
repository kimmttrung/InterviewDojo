// features/mentor/bookings/hooks/useMentorBookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { acceptBooking, getMentorBookings, rejectBooking } from '../services/booking.service';

export const MENTOR_BOOKINGS_QUERY_KEY = ['mentor-bookings'];

export const useMentorBookings = (filters?: { status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...MENTOR_BOOKINGS_QUERY_KEY, filters],
    queryFn: () => getMentorBookings(filters),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptBooking,
    onSuccess: (_, bookingId) => {
      toast.success('Đã chấp nhận booking');
      queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_QUERY_KEY });
      // optionally invalidate slot availability if needed
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể chấp nhận booking');
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      rejectBooking(bookingId, reason),
    onSuccess: () => {
      toast.success('Đã từ chối booking');
      queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể từ chối booking');
    },
  });
};
