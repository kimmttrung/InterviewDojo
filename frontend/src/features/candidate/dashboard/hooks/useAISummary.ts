import { useQuery } from '@tanstack/react-query';

import { getAISummary } from '../services/candidateDashboard.service';

export const useAISummary = (userId: number) => {
  return useQuery({
    queryKey: ['candidate-dashboard', 'ai-summary'],

    queryFn: () => getAISummary(userId),

    staleTime: 1000 * 60 * 30,

    gcTime: 1000 * 60 * 60,
  });
};
