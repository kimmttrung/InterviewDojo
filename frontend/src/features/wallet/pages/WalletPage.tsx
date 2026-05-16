import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, RefreshCcw, Receipt } from 'lucide-react';

import { Layout } from '@/shared/components/layout/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';

import { useWallet } from '../hooks/useWallet';
import { useWalletTransactions } from '../hooks/useWalletTransactions';

import { WalletTransactionType } from '@/shared/types/enum';

function formatAmount(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getTransactionLabel(type: WalletTransactionType) {
  switch (type) {
    case WalletTransactionType.DEPOSIT:
      return 'Nạp credits';

    case WalletTransactionType.PAYMENT:
      return 'Thanh toán booking';

    case WalletTransactionType.REFUND:
      return 'Hoàn tiền booking';

    case WalletTransactionType.PAYOUT:
      return 'Rút tiền';

    case WalletTransactionType.PLATFORM_FEE:
      return 'Phí nền tảng';

    default:
      return type;
  }
}

function getTransactionIcon(type: WalletTransactionType) {
  switch (type) {
    case WalletTransactionType.DEPOSIT:
    case WalletTransactionType.REFUND:
      return (
        <div className="rounded-full bg-green-100 p-2">
          <ArrowDownLeft className="h-4 w-4 text-green-600" />
        </div>
      );

    case WalletTransactionType.PAYMENT:
    case WalletTransactionType.PAYOUT:
    case WalletTransactionType.PLATFORM_FEE:
      return (
        <div className="rounded-full bg-red-100 p-2">
          <ArrowUpRight className="h-4 w-4 text-red-500" />
        </div>
      );

    default:
      return (
        <div className="rounded-full bg-muted p-2">
          <RefreshCcw className="h-4 w-4" />
        </div>
      );
  }
}

function getAmountColor(type: WalletTransactionType) {
  switch (type) {
    case WalletTransactionType.DEPOSIT:
    case WalletTransactionType.REFUND:
      return 'text-green-600';

    default:
      return 'text-red-500';
  }
}

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWallet();

  const { data: transactionsData, isLoading: transactionLoading } = useWalletTransactions({
    page: 1,
    limit: 10,
  });

  const transactions = transactionsData?.items ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Ví Credits</h1>

          <p className="mt-1 text-muted-foreground">Quản lý số dư và lịch sử giao dịch của bạn</p>
        </div>

        {/* WALLET CARD */}
        <Card className="border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80">Số dư hiện tại</p>

                {walletLoading ? (
                  <Skeleton className="mt-3 h-14 w-40 bg-white/20" />
                ) : (
                  <h2 className="mt-2 text-5xl font-bold">
                    {formatAmount(wallet?.creditBalance ?? 0)}
                  </h2>
                )}

                <p className="mt-2 text-white/80">Credits</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <Wallet className="h-10 w-10" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-white text-black hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" />
                Nạp Credits
              </Button>

              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Receipt className="mr-2 h-4 w-4" />
                {transactionsData?.meta.total ?? 0} giao dịch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TRANSACTION HISTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Lịch sử giao dịch</h3>

              <p className="text-sm text-muted-foreground">
                Các giao dịch gần đây trong ví credits
              </p>
            </div>

            {transactionsData?.meta && (
              <Badge variant="secondary">{transactionsData.meta.total} giao dịch</Badge>
            )}
          </div>

          {transactionLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>

                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="mb-3 h-10 w-10 text-muted-foreground" />

                <h4 className="font-semibold">Chưa có giao dịch nào</h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  Các giao dịch ví sẽ xuất hiện tại đây
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive =
                  tx.type === WalletTransactionType.DEPOSIT ||
                  tx.type === WalletTransactionType.REFUND;

                return (
                  <Card key={tx.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {getTransactionIcon(tx.type)}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{getTransactionLabel(tx.type)}</p>

                              <Badge variant={isPositive ? 'default' : 'destructive'}>
                                {tx.type}
                              </Badge>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(tx.createdAt)}</span>

                              {tx.referenceId && (
                                <>
                                  <span>•</span>

                                  <span>Ref: {tx.referenceId}</span>
                                </>
                              )}
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">
                              Số dư: {formatAmount(tx.balanceBefore)}
                              {' → '}
                              {formatAmount(tx.balanceAfter)}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`shrink-0 text-right font-semibold ${
                            tx.amount >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {formatAmount(tx.amount)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
