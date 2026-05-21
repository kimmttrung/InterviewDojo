import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSession } from '../services/session.services';
import { useToast } from '@/hooks/use-toast'; // Giả định bạn có hook toast

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      toast({ title: 'Thành công', description: 'Đã huỷ phiên học' });
      // Vô hiệu hoá cache để TanStack Query tự động gọi lại API lấy danh sách mới
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể huỷ phiên học',
        variant: 'destructive',
      });
    },
  });
};
