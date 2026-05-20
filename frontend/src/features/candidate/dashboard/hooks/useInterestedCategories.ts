import { useQuery } from '@tanstack/react-query';

import { getInterestedCategories } from '../services/candidateDashboard.service';

export const useInterestedCategories = (userId: number) => {
  return useQuery({
    queryKey: ['candidate-dashboard', 'interested-categories'],

    queryFn: () => getInterestedCategories(userId),

    staleTime: 1000 * 60 * 10,
  });
};
