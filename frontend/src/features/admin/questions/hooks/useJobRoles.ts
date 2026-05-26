// src/features/admin/questions/hooks/useJobRoles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobRoleApi } from '../api/jobRoleApi';
import { showToast } from '@/shared/lib/toast';

export const useJobRoles = () => {
  return useQuery({
    queryKey: ['admin', 'jobRoles'],
    queryFn: () => jobRoleApi.getAll(),
  });
};

export const useCreateJobRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => jobRoleApi.create(data),
    onSuccess: (newRole) => {
      showToast.success('Thêm vai trò thành công');
      queryClient.setQueryData(['admin', 'jobRoles'], (old: any) => [...(old || []), newRole]);
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo vai trò'),
  });
};
