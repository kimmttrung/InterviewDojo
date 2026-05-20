import { useQuery } from '@tanstack/react-query';

import { getUpcomingSessions } from '../services/candidateDashboard.service';

export const useUpcomingSessions = (userId: number) => {
  return useQuery({
    queryKey: ['candidate-dashboard', 'upcoming-sessions'],

    queryFn: () => getUpcomingSessions(userId),

    staleTime: 1000 * 60 * 5,
  });
};
