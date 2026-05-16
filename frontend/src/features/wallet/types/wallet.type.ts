// src/features/wallet/types/wallet.type.ts

import { WalletTransactionType } from '@/shared/types/enum';

export interface WalletResponse {
  creditBalance: number;
}

export interface WalletTransaction {
  id: number;
  type: WalletTransactionType;

  amount: number;

  balanceBefore: number;
  balanceAfter: number;

  referenceId: string | null;

  createdAt: string;

  booking?: {
    id: number;
    status: string;
  } | null;
}

export interface PaginatedWalletTransactionResponse {
  items: WalletTransaction[];

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
