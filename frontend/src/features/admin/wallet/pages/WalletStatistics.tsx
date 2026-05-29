// src/features/admin/wallet/pages/WalletStatistics.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAdminWalletStatistics } from '../hooks/useAdminWalletStatistics';
import { AdjustBalanceModal } from '../components/AdjustBalanceModal';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Users,
  RefreshCcw,
} from 'lucide-react';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDateTime = (d: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));

const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  PAYMENT: 'Thanh toán',
  REFUND: 'Hoàn tiền',
  PAYOUT: 'Trả mentor',
  PLATFORM_FEE: 'Phí nền tảng',
  ADMIN_ADJUSTMENT: 'Admin điều chỉnh',
};

export const WalletStatistics = () => {
  const { data, isLoading, refetch, isFetching } = useAdminWalletStatistics();
  const [adjustTarget, setAdjustTarget] = useState<{
    userId: number;
    userName: string;
    balance: number;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Thống kê ví</h1>
          <p className="text-sm text-muted-foreground mt-1">Tổng quan tài chính toàn hệ thống</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng nạp tiền"
          value={data?.totalDeposit}
          thisMonth={data?.totalDepositThisMonth}
          delta={data?.depositDelta}
          icon={<ArrowUpCircle className="h-5 w-5 text-green-500" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Credit lưu hành"
          value={data?.totalCreditInSystem}
          icon={<Wallet className="h-5 w-5 text-blue-500" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Đã trả mentor"
          value={data?.totalPayout}
          icon={<DollarSign className="h-5 w-5 text-purple-500" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Phí nền tảng"
          value={data?.totalPlatformFee}
          thisMonth={data?.totalPlatformFeeThisMonth}
          icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top users by balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top người dùng theo số dư
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))
              : (data?.topUsers ?? []).map((user: any, i: number) => (
                  <div key={user.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      {user.avatarUrl && (
                        <img
                          src={user.avatarUrl}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          alt=""
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm">{formatVND(user.creditBalance)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setAdjustTarget({
                            userId: user.id,
                            userName: user.name,
                            balance: user.creditBalance,
                          })
                        }
                      >
                        Điều chỉnh
                      </Button>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Recent admin adjustments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Điều chỉnh thủ công gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))
            ) : (data?.recentAdjustments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có điều chỉnh nào
              </p>
            ) : (
              (data?.recentAdjustments ?? []).map((tx: any) => (
                <div key={tx.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tx.note}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      tx.balanceAfter > tx.balanceBefore ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {tx.balanceAfter > tx.balanceBefore ? '+' : '-'}
                    {formatVND(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adjust balance modal */}
      {adjustTarget && (
        <AdjustBalanceModal
          open={!!adjustTarget}
          onClose={() => setAdjustTarget(null)}
          userId={adjustTarget.userId}
          userName={adjustTarget.userName}
          currentBalance={adjustTarget.balance}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

// ── StatCard component ────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value?: number;
  thisMonth?: number;
  delta?: number;
  icon: React.ReactNode;
  isLoading: boolean;
}

const StatCard = ({ title, value, thisMonth, delta, icon, isLoading }: StatCardProps) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32 mt-2" />
          ) : (
            <p className="text-2xl font-bold mt-1 truncate">{formatVND(value ?? 0)}</p>
          )}
          {thisMonth !== undefined && !isLoading && (
            <p className="text-xs text-muted-foreground mt-1">Tháng này: {formatVND(thisMonth)}</p>
          )}
        </div>
        <div className="shrink-0 ml-2">{icon}</div>
      </div>
      {delta !== undefined && !isLoading && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            delta >= 0 ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta >= 0 ? '+' : ''}
          {delta}% so với tháng trước
        </div>
      )}
    </CardContent>
  </Card>
);
