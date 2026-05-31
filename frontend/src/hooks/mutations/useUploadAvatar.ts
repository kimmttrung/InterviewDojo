import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/features/auth/services/user.service';
import { showToast } from '@/shared/lib/toast';

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      // Ghi đè cache current-user → mọi component dùng useCurrentUser sẽ tự cập nhật
      queryClient.setQueryData(['current-user'], updatedUser);
      showToast.success('Ảnh đại diện đã được cập nhật!');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Upload thất bại';
      showToast.error(msg);
    },
  });
};
