// src/features/wallet/services/wallet.service.ts

import { api } from '@/shared/lib/api';
import type { WalletResponse, PaginatedWalletTransactionResponse } from '../types/wallet.type';

export const walletService = {
  async getMyWallet(): Promise<WalletResponse> {
    const response = await api.get('/wallet/me');

    return response.data.data;
  },

  async getMyTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedWalletTransactionResponse> {
    const response = await api.get('/wallet/transactions', {
      params,
    });

    return response.data.data;
  },
};
