// features/bookmark/hooks/useBookmark.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkQuestion, unbookmarkQuestion } from '../services/bookmark.services';
import { useToast } from '@/hooks/use-toast';

export const useBookmarkToggle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bookmarkMutation = useMutation({
    mutationFn: (questionId: number) => bookmarkQuestion(questionId),
    onSuccess: (_, questionId) => {
      toast({ title: 'Thành công', description: 'Đã lưu câu hỏi' });
      // Cập nhật cache: set isBookmarked = true cho question cụ thể
      queryClient.setQueryData(['question', questionId], (oldData: any) => {
        if (oldData) return { ...oldData, isBookmarked: true };
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const unbookmarkMutation = useMutation({
    mutationFn: (questionId: number) => unbookmarkQuestion(questionId),
    onSuccess: (_, questionId) => {
      toast({ title: 'Thành công', description: 'Đã bỏ lưu câu hỏi' });
      queryClient.setQueryData(['question', questionId], (oldData: any) => {
        if (oldData) return { ...oldData, isBookmarked: false };
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const toggleBookmark = (questionId: number, isCurrentlyBookmarked: boolean) => {
    if (isCurrentlyBookmarked) {
      unbookmarkMutation.mutate(questionId);
    } else {
      bookmarkMutation.mutate(questionId);
    }
  };

  return { toggleBookmark, isPending: bookmarkMutation.isPending || unbookmarkMutation.isPending };
};
