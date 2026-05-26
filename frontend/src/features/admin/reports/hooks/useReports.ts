// hooks/useReports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';
import { Report, ReportStatus } from '../types/report.types';

// Helper unwrap (giống trong useAdminUsers)
function unwrapItems(response: any): Report[] {
  return response?.data?.data?.items ?? [];
}
function unwrapItem(response: any): Report {
  return response?.data?.data;
}

export const useReports = (filters: {
  page: number;
  limit: number;
  status?: string;
  targetType?: string;
}) => {
  const query = useQuery({
    queryKey: queryKeys.admin.reports(filters),
    queryFn: () => reportApi.getAll(filters),
  });
  return {
    ...query,
    data: unwrapItems(query.data),
  };
};

export const useReportDetail = (id: number) => {
  const query = useQuery({
    queryKey: queryKeys.admin.reportDetail(id),
    queryFn: () => reportApi.getOne(id),
    enabled: !!id,
  });
  return {
    ...query,
    data: unwrapItem(query.data),
  };
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { status: ReportStatus; adminNote?: string };
    }) => reportApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      showToast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reportDetail(id) });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi cập nhật'),
  });
};
