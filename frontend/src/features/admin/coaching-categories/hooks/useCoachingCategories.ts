// src/features/admin/coaching-categories/hooks/useCoachingCategories.ts
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachingCategoryApi } from '../api/coachingCategoryApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';
import {
  CreateCoachingCategoryDto,
  UpdateCoachingCategoryDto,
  CoachingCategory,
} from '../types/coaching-category.types';

// Helper unwrap (giống pattern trong useAdminUsers)
function unwrapCategories(response: any): CoachingCategory[] {
  return response?.data?.data ?? [];
}

export const useCoachingCategories = () => {
  const query = useQuery({
    queryKey: queryKeys.admin.coachingCategories,
    queryFn: () => coachingCategoryApi.getAll(),
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;
      showToast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách danh mục');
    }
  }, [query.error]);

  return {
    ...query,
    data: unwrapCategories(query.data),
  };
};

export const useCreateCoachingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoachingCategoryDto) => coachingCategoryApi.create(data),
    onSuccess: () => {
      showToast.success('Tạo danh mục thành công');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coachingCategories });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo'),
  });
};

export const useUpdateCoachingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCoachingCategoryDto }) =>
      coachingCategoryApi.update(id, data),
    onSuccess: () => {
      showToast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coachingCategories });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi cập nhật'),
  });
};

export const useDeleteCoachingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coachingCategoryApi.delete(id),
    onSuccess: () => {
      showToast.success('Xóa danh mục thành công');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coachingCategories });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi xóa'),
  });
};
