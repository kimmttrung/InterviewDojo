import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, updateComment, deleteComment } from '../api/comment.api';
import { commentKeys } from './useComments';
import { showToast } from '@/shared/lib/toast';

export const useCommentMutations = (questionId: number) => {
  const queryClient = useQueryClient();

  // Helper để báo cache refetch
  const invalidateList = () => {
    queryClient.invalidateQueries({
      queryKey: [...commentKeys.lists(), { questionId }],
    });
  };

  const createMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      invalidateList();
      showToast.success('Đã gửi bình luận');
    },
    onError: () => showToast.error('Không thể gửi bình luận'),
  });

  const updateMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      invalidateList();
      showToast.success('Đã cập nhật bình luận');
    },
    onError: () => showToast.error('Lỗi khi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      invalidateList();
      // showToast có warning/success/error. Dùng success cho thông báo xóa hoàn tất.
      showToast.success('Bình luận đã bị xóa');
    },
    onError: () => showToast.error('Lỗi khi xóa'),
  });

  return { createMutation, updateMutation, deleteMutation };
};
