import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/shared/lib/toast';

import { userService } from '@/features/auth/services/user.service';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['current-user'],
      });

      showToast.success('Profile updated successfully');
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Update profile failed';

      showToast.error(Array.isArray(message) ? message[0] : message);
    },
  });
};
