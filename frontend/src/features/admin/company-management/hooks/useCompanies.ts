// features/admin/companies/hooks/useCompanies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../services/company.service';
import { toast } from 'sonner';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['admin-companies'],
    queryFn: companyService.getAll,
  });
};

export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      toast.success('Tạo công ty thành công');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi tạo');
    },
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => companyService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      toast.success('Cập nhật công ty thành công');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật');
    },
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      toast.success('Xóa công ty thành công');
    },
    onError: () => {
      toast.error('Xóa thất bại');
    },
  });
};
