// src/features/admin/wallet/hooks/useAdminAdjustBalance.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminWalletApi } from '../api/adminWalletApi';
import { showToast } from '@/shared/lib/toast';

interface AdjustPayload {
  userId: number;
  amount: number;
  note: string;
}

export const useAdminAdjustBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, amount, note }: AdjustPayload) =>
      adminWalletApi.adjustBalance(userId, amount, note),
    onSuccess: (data) => {
      const sign = data.adjustment > 0 ? '+' : '';
      showToast.success(
        `Đã ${data.adjustment > 0 ? 'cộng' : 'trừ'} ${Math.abs(data.adjustment).toLocaleString('vi-VN')}đ cho ${data.userName}`,
      );
      // Invalidate để refetch danh sách transaction và statistics
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) =>
      showToast.error(err?.response?.data?.message || 'Lỗi khi điều chỉnh số dư'),
  });
};
