import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export interface WalletResponse {
  creditBalance: number;
}

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async (): Promise<WalletResponse> => {
      const response = await api.get('/wallet/me');
      return response.data.data;
    },
  });
};
