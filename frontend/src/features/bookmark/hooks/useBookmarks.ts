import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookmarkedQuestions, unbookmarkQuestion } from '../services/bookmark.services';
import { useBookmarkStore } from '../stores/useBookmarkStore';
import { useToast } from '@/hooks/use-toast';

export const useBookmarks = () => {
  const filters = useBookmarkStore((state) => state.filters);
  return useQuery({
    queryKey: ['bookmarks', filters],
    queryFn: () => getBookmarkedQuestions(filters),
  });
};

export const useUnbookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: unbookmarkQuestion,
    onSuccess: () => {
      toast({ title: 'Thành công', description: 'Đã bỏ lưu câu hỏi' });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể bỏ lưu',
        variant: 'destructive',
      });
    },
  });
};
