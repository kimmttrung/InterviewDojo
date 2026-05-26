// features/admin/job-roles/hooks/useJobRoles.ts
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

export const useUpdateJobRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      jobRoleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobRoles'] });
      showToast.success('Cập nhật vai trò thành công');
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi cập nhật'),
  });
};

export const useDeleteJobRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobRoleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobRoles'] });
      showToast.success('Xóa vai trò thành công');
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Không thể xóa vai trò'),
  });
};
