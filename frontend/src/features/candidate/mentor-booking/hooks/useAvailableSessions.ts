import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import type { AvailableSession } from '../types/mentor-detail.types';

export const useAvailableSessions = (mentorId: number, planId: number, date: string) => {
  return useQuery<AvailableSession[]>({
    queryKey: ['available-sessions', mentorId, planId, date],
    queryFn: () => bookingService.getAvailableSessions(mentorId, planId, date),
    enabled: !!date,
  });
};
