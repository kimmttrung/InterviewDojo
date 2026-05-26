import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/companyApi';
import { showToast } from '@/shared/lib/toast';
import type { Company } from '../types/companies.types';

export const useCompanies = () => {
  return useQuery<Company[]>({
    queryKey: ['admin', 'companies'],
    queryFn: companyApi.getAll,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; industry?: string; logoUrl?: string }) =>
      companyApi.create(data),
    onSuccess: (newCompany) => {
      showToast.success('Thêm công ty thành công');
      queryClient.setQueryData<Company[]>(['admin', 'companies'], (old) => [
        ...(old || []),
        newCompany,
      ]);
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo công ty'),
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; industry?: string; logoUrl?: string };
    }) => companyApi.update(id, data),
    onSuccess: () => {
      showToast.success('Cập nhật công ty thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi cập nhật'),
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyApi.delete(id),
    onSuccess: () => {
      showToast.success('Xóa công ty thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: () => showToast.error('Xóa thất bại'),
  });
};
