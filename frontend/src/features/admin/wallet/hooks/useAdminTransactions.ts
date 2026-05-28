// src/features/admin/wallet/hooks/useAdminTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { adminWalletApi } from '../api/adminWalletApi';

interface Params {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const useAdminTransactions = (params: Params) => {
  return useQuery({
    queryKey: ['admin', 'wallet-transactions', params],
    queryFn: () => adminWalletApi.getTransactions(params),
    staleTime: 30_000,
  });
};
