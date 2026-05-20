// features/candidate/list-mentor/hooks/useMentors.ts
import { useQuery } from '@tanstack/react-query';
import { mentorService, MentorFilters } from '../services/mentor.service';
import { queryKeys } from '@/shared/lib/queryKeys';

export const useMentors = (filters: MentorFilters) => {
  return useQuery({
    queryKey: queryKeys.mentor.list(filters),
    queryFn: () => mentorService.list(filters),
    placeholderData: (prev) => prev,
  });
};
