import { useState } from 'react';
import { RefreshCcw, BadgeCheck, Ban, WalletCards } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  useAdminMentorPayouts,
  useApproveMentorPayout,
  useRejectMentorPayout,
} from '../hooks/useAdminMentorPayouts';
import { MentorPayoutStatus } from '../api/adminMentorPayoutApi';

type UserSummary = {
  id: number;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
};

type MentorPayout = {
  id: number;
  sessionId: number;
  bookingId: number;
  grossAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  mentorEarning: number;
  refundableAmount: number;
  status: MentorPayoutStatus;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  mentor: UserSummary;
  candidate: UserSummary;
  booking: {
    snapshotPlanTitle: string;
    snapshotPlanPrice: number | null;
    startTime: string;
    endTime: string;
    status: string;
  };
  session: {
    scheduledAt: string;
    endedAt?: string | null;
    status: string;
  };
};

const statusConfig: Record<MentorPayoutStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Cho duyet',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  COMPLETED: {
    label: 'Da thanh toan',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  REJECTED: {
    label: 'Tu choi',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  FAILED: {
    label: 'That bai',
    className: 'bg-slate-100 text-slate-800 border border-slate-200',
  },
};

const formatVND = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)}d`;

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-';

export const MentorPayoutList = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<MentorPayoutStatus | 'ALL'>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<MentorPayout | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const query = {
    page,
    limit: 15,
    status: status === 'ALL' ? undefined : status,
  };

  const { data, isLoading, isFetching, refetch } = useAdminMentorPayouts(query);
  const approveMutation = useApproveMentorPayout();
  const rejectMutation = useRejectMentorPayout();

  const payouts: MentorPayout[] = data?.items ?? [];
  const meta = data?.meta;

  const openRejectDialog = (payout: MentorPayout) => {
    setRejectTarget(payout);
    setRejectReason('');
    setRefundAmount(String(payout.refundableAmount));
  };

  const submitReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;

    rejectMutation.mutate(
      {
        id: rejectTarget.id,
        payload: {
          reason: rejectReason.trim(),
          refundableAmount: refundAmount ? Number(refundAmount) : undefined,
        },
      },
      {
        onSuccess: () => setRejectTarget(null),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thanh toan mentor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Duyet payout sau khi session mentor booking hoan thanh
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Lam moi
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as MentorPayoutStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md">
            <SelectItem value="ALL">Tat ca</SelectItem>
            <SelectItem value="PENDING">Cho duyet</SelectItem>
            <SelectItem value="COMPLETED">Da thanh toan</SelectItem>
            <SelectItem value="REJECTED">Tu choi</SelectItem>
            <SelectItem value="FAILED">That bai</SelectItem>
          </SelectContent>
        </Select>
        {meta && <Badge variant="secondary">{meta.total} payout</Badge>}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead className="text-right">Booking</TableHead>
              <TableHead className="text-right">Phi</TableHead>
              <TableHead className="text-right">Mentor nhan</TableHead>
              <TableHead>Trang thai</TableHead>
              <TableHead className="text-right">Hanh dong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: 8 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Khong co payout phu hop
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => {
                const config = statusConfig[payout.status];
                const isPending = payout.status === 'PENDING';

                return (
                  <TableRow key={payout.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">#{payout.sessionId}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(payout.session.endedAt ?? payout.booking.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserCell user={payout.mentor} />
                    </TableCell>
                    <TableCell>
                      <UserCell user={payout.candidate} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{formatVND(payout.grossAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {payout.booking.snapshotPlanTitle}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>{formatVND(payout.platformFeeAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {payout.platformFeePercent}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {formatVND(payout.mentorEarning)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(payout.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <BadgeCheck className="h-4 w-4 mr-1" />
                            Duyet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(payout)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Tu choi
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(payout.reviewedAt)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Truoc
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tu choi payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {rejectTarget && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <WalletCards className="h-4 w-4" />
                  Refund candidate
                </div>
                <div className="mt-1 text-muted-foreground">
                  Toi da {formatVND(rejectTarget.grossAmount)} cho session #{rejectTarget.sessionId}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="refundAmount">So tien refund</Label>
              <Input
                id="refundAmount"
                type="number"
                min={0}
                value={refundAmount}
                onChange={(event) => setRefundAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Ly do</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Vi du: Candidate dispute hop le, session khong du dieu kien..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Huy
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Xac nhan tu choi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function UserCell({ user }: { user: UserSummary }) {
  return (
    <div className="flex items-center gap-2">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-muted" />
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{user.name ?? `User #${user.id}`}</div>
        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
      </div>
    </div>
  );
}
