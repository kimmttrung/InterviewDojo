import { WalletTransactionType } from '@prisma/client';

export interface WalletResponse {
  creditBalance: number;
}

export interface WalletTransactionResponse {
  id: number;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  createdAt: Date;

  booking: {
    id: number;
    status: string;
  } | null;
}

export interface PaginatedWalletTransactionResponse {
  items: WalletTransactionResponse[];

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
