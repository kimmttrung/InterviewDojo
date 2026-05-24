import { useQuery } from '@tanstack/react-query';

import { mentorService } from '../services/mentor.service';

export const useRecommendedMentors = (candidateUserId?: number) => {
  return useQuery({
    queryKey: ['mentor', 'recommendation', candidateUserId],

    queryFn: () => mentorService.getRecommendations(candidateUserId!),

    enabled: !!candidateUserId,
  });
};
