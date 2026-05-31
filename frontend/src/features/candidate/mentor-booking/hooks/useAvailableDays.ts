import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';

export const useAvailableDays = (mentorId: number, planId: number, month: string) => {
  return useQuery({
    queryKey: ['available-days', mentorId, planId, month],
    queryFn: () => bookingService.getAvailableDays(mentorId, planId, month),
    enabled: !!mentorId && !!planId && !!month,
  });
};
