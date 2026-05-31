import { useQuery } from '@tanstack/react-query';
import { getAnalyticsOverview } from '../services/candidateDashboard.service';

export const useAnalyticsOverview = (userId: number) => {
  return useQuery({
    queryKey: ['candidate-dashboard', 'analytics-overview', userId],
    queryFn: () => getAnalyticsOverview(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
