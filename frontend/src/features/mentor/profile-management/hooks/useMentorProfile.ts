import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/queryKeys';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useMentorProfile = () => {
  return useQuery({
    queryKey: queryKeys.mentor.profile,

    queryFn: mentorProfileService.getMyMentorProfile,
    staleTime: 5 * 60 * 1000,
  });
};
