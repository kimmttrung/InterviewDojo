// src/features/admin/wallet/hooks/useAdminWalletStatistics.ts
import { useQuery } from '@tanstack/react-query';
import { adminWalletApi } from '../api/adminWalletApi';

export const useAdminWalletStatistics = () => {
  return useQuery({
    queryKey: ['admin', 'wallet-statistics'],
    queryFn: () => adminWalletApi.getStatistics(),
    staleTime: 60_000,
  });
};
