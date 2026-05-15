import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

import { showToast } from '@/shared/lib/toast';
import { queryKeys } from '@/shared/lib/queryKeys';

export const useUpdateMentorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mentorProfileService.updateProfile,

    onSuccess: async () => {
      // queryClient.setQueryData(['mentor-profile'], data);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.mentor.profile,
      });

      showToast.success('Profile updated successfully');
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Update failed';

      showToast.error(message);
    },
  });
};
