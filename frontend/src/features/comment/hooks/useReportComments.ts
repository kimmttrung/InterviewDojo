import { useMutation } from '@tanstack/react-query';
import { reportComment } from '../api/comment.api';
import { showToast } from '@/shared/lib/toast';

export const useReportComment = () => {
  return useMutation({
    mutationFn: reportComment,
    onSuccess: () => showToast.success('Đã gửi báo cáo, admin sẽ xem xét'),
    onError: () => showToast.error('Gửi báo cáo thất bại'),
  });
};
