// src/features/admin/wallet/pages/TransactionList.tsx
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useAdminTransactions } from '../hooks/useAdminTransactions';
import { useDebounce } from '@/hooks/use-debounce';
import { RefreshCcw, Search } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDateTime = (d: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));

const TX_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  DEPOSIT: { label: 'Nạp tiền', className: 'bg-green-100 text-green-800' },
  PAYMENT: { label: 'Thanh toán', className: 'bg-red-100 text-red-800' },
  REFUND: { label: 'Hoàn tiền', className: 'bg-yellow-100 text-yellow-800' },
  PAYOUT: { label: 'Trả mentor', className: 'bg-blue-100 text-blue-800' },
  PLATFORM_FEE: { label: 'Phí nền tảng', className: 'bg-purple-100 text-purple-800' },
  ADMIN_ADJUSTMENT: { label: 'Admin điều chỉnh', className: 'bg-orange-100 text-orange-800' },
};

// ── component ─────────────────────────────────────────────────────────────────

export const TransactionList = () => {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, refetch, isFetching } = useAdminTransactions({
    page,
    limit: 15,
    type: type || undefined,
    search: debouncedSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const transactions = data?.items ?? [];
  const meta = data?.meta;

  const handleFilterChange = () => setPage(1); // reset page khi đổi filter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Quản lý giao dịch</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toàn bộ lịch sử giao dịch ví của hệ thống
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, tên, mã tham chiếu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={type || 'ALL'}
          onValueChange={(v) => {
            setType(v === 'ALL' ? '' : v);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(TX_TYPE_CONFIG).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleFilterChange();
            }}
            className="w-[145px]"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleFilterChange();
            }}
            className="w-[145px]"
          />
        </div>

        {(type || search || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setType('');
              setSearch('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
          >
            Xóa filter
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Số dư trước → sau</TableHead>
              <TableHead>Mã tham chiếu</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Không có giao dịch nào
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx: any) => {
                const config = TX_TYPE_CONFIG[tx.type] ?? {
                  label: tx.type,
                  className: 'bg-gray-100 text-gray-800',
                };
                const isPositive = ['DEPOSIT', 'REFUND', 'ADMIN_ADJUSTMENT'].includes(tx.type)
                  ? tx.amount >= 0
                  : false;

                return (
                  <TableRow key={tx.id} className="hover:bg-muted/40">
                    <TableCell className="text-muted-foreground text-xs">{tx.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.user?.avatarUrl && (
                          <img
                            src={tx.user.avatarUrl}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm leading-tight">
                            {tx.user?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.user?.email ?? '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {isPositive ? '+' : '-'}
                      {formatVND(Math.abs(tx.amount))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatVND(tx.balanceBefore)} <span className="text-foreground">→</span>{' '}
                      {formatVND(tx.balanceAfter)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground font-mono">
                        {tx.referenceId ?? '—'}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {meta.total} giao dịch · Trang {page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
