// src/features/admin/wallet/api/adminWalletApi.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const adminWalletApi = {
  getTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get(API_ENDPOINT.ADMIN.WALLET_TRANSACTIONS, { params }).then((res) => res.data.data),

  getStatistics: () => api.get(API_ENDPOINT.ADMIN.WALLET_STATISTICS).then((res) => res.data.data),

  adjustBalance: (userId: number, amount: number, note: string) =>
    api
      .post(API_ENDPOINT.ADMIN.WALLET_ADJUST(userId), {
        amount,
        note,
      })
      .then((res) => res.data.data),
};
