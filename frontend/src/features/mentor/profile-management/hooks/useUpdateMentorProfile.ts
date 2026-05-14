import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

import { showToast } from '@/shared/lib/toast';

export const useUpdateMentorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mentorProfileService.updateProfile,

    onSuccess: (data) => {
      queryClient.setQueryData(['mentor-profile'], data);

      showToast.success('Profile updated successfully');
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Update failed';

      showToast.error(message);
    },
  });
};
