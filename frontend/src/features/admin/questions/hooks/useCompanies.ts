// src/features/admin/questions/hooks/useCompanies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/companyApi';
import { showToast } from '@/shared/lib/toast';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => companyApi.getAll(),
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; industry?: string; logoUrl?: string }) =>
      companyApi.create(data),
    onSuccess: (newCompany) => {
      showToast.success('Thêm công ty thành công');
      queryClient.setQueryData(['admin', 'companies'], (old: any) => [...(old || []), newCompany]);
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo công ty'),
  });
};
