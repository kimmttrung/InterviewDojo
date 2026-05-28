// src/features/wallet/hooks/useDeposit.ts
import { useMutation } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import { showToast } from '@/shared/lib/toast';

export interface DepositResult {
  paymentId: number;
  orderCode: string;
  amount: number;
  expiredAt: string;
}

export const useDeposit = () => {
  return useMutation({
    mutationFn: async (amount: number): Promise<DepositResult> => {
      const res = await paymentApi.deposit(amount);
      return res.data.data as DepositResult;
    },
    onSuccess: () => {
      showToast.success('Tạo đơn nạp tiền thành công');
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.message || 'Lỗi khi tạo yêu cầu nạp tiền');
    },
  });
};
