// src/features/wallet/hooks/useWalletTransactions.ts

import { useQuery } from '@tanstack/react-query';

import { walletService } from '../api/walletApi';

interface Params {
  page?: number;
  limit?: number;
  type?: string;
}

export function useWalletTransactions(params?: Params) {
  return useQuery({
    queryKey: ['wallet-transactions', params],

    queryFn: () => walletService.getMyTransactions(params),

    staleTime: 1000 * 30,
  });
}
