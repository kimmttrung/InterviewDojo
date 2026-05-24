// src/features/reports/hooks/useReportUser.ts
import { useMutation } from '@tanstack/react-query';
import { reportUser } from '../api/report.api';
import { toast } from 'sonner'; // hoặc bất kỳ toast nào bạn dùng

export const useReportUser = () => {
  return useMutation({
    mutationFn: reportUser,
    onSuccess: () => {
      toast.success('Báo cáo đã được gửi thành công, admin sẽ xem xét');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Gửi báo cáo thất bại';
      toast.error(message);
    },
  });
};
