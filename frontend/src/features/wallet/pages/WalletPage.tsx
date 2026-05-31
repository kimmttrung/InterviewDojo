import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BanknoteArrowDown,
  Plus,
  Receipt,
  RefreshCcw,
  Wallet,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { MentorLayout } from '@/features/mentor/dashboard/components/MentorLayout';
import { Layout } from '@/shared/components/layout/Layout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { WalletTransactionType } from '@/shared/types/enum';

import { DepositModal } from '../components/DepositModal';
import { useWallet } from '../hooks/useWallet';
import { useWalletTransactions } from '../hooks/useWalletTransactions';

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US').format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getTransactionLabel(type: WalletTransactionType) {
  switch (type) {
    case WalletTransactionType.DEPOSIT:
      return 'Deposit credits';
    case WalletTransactionType.PAYMENT:
      return 'Booking payment';
    case WalletTransactionType.REFUND:
      return 'Booking refund';
    case WalletTransactionType.PAYOUT:
      return 'Withdrawal';
    case WalletTransactionType.PLATFORM_FEE:
      return 'Platform fee';
    case WalletTransactionType.ADMIN_ADJUSTMENT:
      return 'Admin adjustment';
    default:
      return type;
  }
}

function getTransactionIcon(type: WalletTransactionType) {
  const isIncoming =
    type === WalletTransactionType.DEPOSIT || type === WalletTransactionType.REFUND;

  if (isIncoming) {
    return (
      <div className="rounded-full bg-green-100 p-2">
        <ArrowDownLeft className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  if (
    type === WalletTransactionType.PAYMENT ||
    type === WalletTransactionType.PAYOUT ||
    type === WalletTransactionType.PLATFORM_FEE
  ) {
    return (
      <div className="rounded-full bg-red-100 p-2">
        <ArrowUpRight className="h-4 w-4 text-red-500" />
      </div>
    );
  }

  return (
    <div className="rounded-full bg-muted p-2">
      <RefreshCcw className="h-4 w-4" />
    </div>
  );
}

interface WalletContentProps {
  title?: string;
  description?: string;
  balanceLabel?: string;
  showTopUp?: boolean;
  showWithdraw?: boolean;
}

function WalletContent({
  title = 'Credits Wallet',
  description = 'Manage your balance and transaction history',
  balanceLabel = 'Current Balance',
  showTopUp = true,
  showWithdraw = false,
}: WalletContentProps) {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactionsData, isLoading: transactionLoading } = useWalletTransactions({
    page: 1,
    limit: 10,
  });

  const transactions = transactionsData?.items ?? [];

  const handleDepositSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };

  const handleWithdrawMock = () => {
    toast.success('Withdrawal request created (mock)');
  };

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>

        <Card className="border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80">{balanceLabel}</p>
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
              {showTopUp && (
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={() => setDepositOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Top Up Credits
                </Button>
              )}

              {showWithdraw && (
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={handleWithdrawMock}
                >
                  <BanknoteArrowDown className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              )}

              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Receipt className="mr-2 h-4 w-4" />
                {transactionsData?.meta.total ?? 0} transactions
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <p className="text-sm text-muted-foreground">
                Recent transactions in your credits wallet
              </p>
            </div>
            {transactionsData?.meta && (
              <Badge variant="secondary">{transactionsData.meta.total} transactions</Badge>
            )}
          </div>

          {transactionLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
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
                <h4 className="font-semibold">No transactions yet</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your wallet transactions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isIncoming = tx.balanceAfter >= tx.balanceBefore;
                const displayAmount = Math.abs(tx.amount);

                return (
                  <Card key={tx.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                              <Badge variant={isIncoming ? 'default' : 'destructive'}>
                                {tx.type}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(tx.createdAt)}</span>
                              {tx.referenceId && (
                                <>
                                  <span>*</span>
                                  <span className="font-mono text-xs">{tx.referenceId}</span>
                                </>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Balance: {formatAmount(tx.balanceBefore)} -&gt;{' '}
                              {formatAmount(tx.balanceAfter)}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`shrink-0 text-right font-semibold ${
                            isIncoming ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}
                          {formatAmount(displayAmount)}
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

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={handleDepositSuccess}
      />
    </>
  );
}

export default function WalletPage() {
  return (
    <Layout>
      <div className="p-6">
        <WalletContent />
      </div>
    </Layout>
  );
}

export function MentorWalletPage() {
  return (
    <MentorLayout>
      <WalletContent
        title="Mentor Wallet"
        description="Manage your earnings and withdrawal history"
        balanceLabel="Available Balance"
        showTopUp={false}
        showWithdraw
      />
    </MentorLayout>
  );
}
