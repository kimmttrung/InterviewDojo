import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { showToast } from '@/shared/lib/toast';

export const useCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => categoryApi.getAll(),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => categoryApi.create(data),
    onSuccess: (newCategory) => {
      showToast.success('Thêm danh mục thành công');
      queryClient.setQueryData(['admin', 'categories'], (old: any) => [
        ...(old || []),
        newCategory,
      ]);
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo'),
  });
};
