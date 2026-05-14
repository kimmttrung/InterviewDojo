import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import type { CoachingPlan } from '../types';

export const useMentorPlans = (userId: number) => {
  return useQuery<CoachingPlan[]>({
    queryKey: ['plans', userId],
    queryFn: () => bookingService.getMentorPlans(userId),
    enabled: !!userId,
  });
};
