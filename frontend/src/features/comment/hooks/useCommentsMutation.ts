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
      showToast.success('Comment posted successfully');
    },
    onError: () => showToast.error('Failed to post comment'),
  });

  const updateMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      invalidateList();
      showToast.success('Comment updated successfully');
    },
    onError: () => showToast.error('Failed to update comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      invalidateList();
      showToast.success('Comment deleted successfully');
    },
    onError: () => showToast.error('Failed to delete comment'),
  });

  return { createMutation, updateMutation, deleteMutation };
};
