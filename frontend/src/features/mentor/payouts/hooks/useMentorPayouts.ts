import { useQuery } from '@tanstack/react-query';
import { mentorPayoutService } from '../services/mentorPayout.service';

export const useMentorPayouts = (filters?: { status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['mentor-payouts', filters],
    queryFn: () => mentorPayoutService.getMyPayouts(filters),
    staleTime: 60 * 1000,
  });
};
