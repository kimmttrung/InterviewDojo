import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/queryKeys';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useSubmitMentorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mentorProfileService.submitMentorProfile,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentor.profile,
      });
    },
  });
};
