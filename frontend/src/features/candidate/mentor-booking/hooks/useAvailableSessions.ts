import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';

export const useAvailableSessions = (mentorId: number, planId: number, date: string) => {
  return useQuery({
    queryKey: ['available-sessions', mentorId, planId, date],
    queryFn: () => bookingService.getAvailableSessions(mentorId, planId, date),
    enabled: !!date,
  });
};
