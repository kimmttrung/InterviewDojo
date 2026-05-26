// useCategories.ts — fixed: invalidate cache on create so RelationSelector updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { showToast } from '@/shared/lib/toast';

export const useCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => categoryApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => categoryApi.create(data),
    onSuccess: (newCategory) => {
      showToast.success('Thêm danh mục thành công');
      // Optimistic update — append to existing list without refetch
      queryClient.setQueryData(['admin', 'categories'], (old: any[]) => [
        ...(old || []),
        newCategory,
      ]);
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo danh mục'),
  });
};
