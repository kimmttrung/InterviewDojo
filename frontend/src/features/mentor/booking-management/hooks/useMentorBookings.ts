// features/mentor/bookings/hooks/useMentorBookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { toast } from 'sonner';

export const MENTOR_BOOKINGS_QUERY_KEY = ['mentor-bookings'];

export const useMentorBookings = (filters?: { status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...MENTOR_BOOKINGS_QUERY_KEY, filters],
    queryFn: () => bookingService.getMentorBookings(filters),
    staleTime: 60 * 1000,
  });
};

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.acceptBooking,
    onSuccess: () => {
      toast.success('Accepted booking successfully');
      queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to accept booking');
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      bookingService.rejectBooking(bookingId, reason),
    onSuccess: () => {
      toast.success('Rejected booking successfully');
      queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject booking');
    },
  });
};
