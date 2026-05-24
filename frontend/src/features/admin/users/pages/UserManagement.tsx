import { useState } from 'react';
import { useAdminUsers, useReportedUsers, useBanUser, useUnbanUser } from '../hooks/useAdminUsers';
import { BanUserDialog } from '../components/BanUserDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Search, Ban, Unlock, ShieldAlert, Users, AlertTriangle } from 'lucide-react';
import { AdminUser, ReportedUserItem, BanFormData } from '../types/user.types';
import { useDebounce } from '@/hooks/use-debounce';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Config ──────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'Admin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  MENTOR: { label: 'Mentor', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  CANDIDATE: { label: 'Candidate', className: 'bg-green-100 text-green-800 border-green-200' },
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  HARASSMENT: 'Quấy rối',
  SCAM: 'Lừa đảo',
  FAKE_PROFILE: 'Hồ sơ giả',
  NO_SHOW: 'Vắng mặt',
  CHEATING: 'Gian lận',
  PAYMENT_OUTSIDE: 'Thanh toán ngoài',
};

function getInitials(name: string) {
  return (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

// Hiển thị bannedUntil (UTC ISO string) theo múi giờ VN
function formatBannedUntil(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// ─── Sub-component: Action buttons ───────────────────────────────────
function UserActions({
  user,
  onBan,
  onUnban,
  banPending,
  unbanPending,
}: {
  user: AdminUser;
  onBan: (u: AdminUser) => void;
  onUnban: (u: AdminUser) => void;
  banPending: boolean;
  unbanPending: boolean;
}) {
  if (user.role === 'ADMIN') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (user.status === 'BANNED') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUnban(user)}
        disabled={unbanPending}
        className="gap-1.5"
      >
        <Unlock className="h-3.5 w-3.5" /> Mở khóa
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => onBan(user)}
      disabled={banPending}
      className="gap-1.5"
    >
      <Ban className="h-3.5 w-3.5" /> Khóa
    </Button>
  );
}

// ─── Sub-component: User row ─────────────────────────────────────────
function UserRow({
  user,
  onBan,
  onUnban,
  banPending,
  unbanPending,
}: {
  user: AdminUser;
  onBan: (u: AdminUser) => void;
  onUnban: (u: AdminUser) => void;
  banPending: boolean;
  unbanPending: boolean;
}) {
  const roleCfg = ROLE_CONFIG[user.role] ?? {
    label: user.role,
    className: 'bg-gray-100 text-gray-700',
  };
  const navigate = useNavigate();

  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatarUrl ?? ''} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <Badge variant="outline" className={`text-xs ${roleCfg.className}`}>
          {roleCfg.label}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {user.status === 'BANNED' ? (
          <div>
            <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
              Bị khóa
            </Badge>
            {user.bannedUntil ? (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Đến {formatBannedUntil(user.bannedUntil)}
              </p>
            ) : (
              <p className="text-[11px] text-red-600 mt-0.5 font-medium">Vĩnh viễn</p>
            )}
            {user.banReason && (
              <p
                className="text-[11px] text-muted-foreground mt-0.5 max-w-[180px] truncate"
                title={user.banReason}
              >
                Lý do: {user.banReason}
              </p>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
            Hoạt động
          </Badge>
        )}
      </td>

      {/* Reports */}
      <td className="px-4 py-3 text-sm text-center text-muted-foreground">
        {user._count?.reportsReceived ?? 0}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/users/${user.id}`)}
            className="gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            Xem
          </Button>

          <UserActions
            user={user}
            onBan={onBan}
            onUnban={onUnban}
            banPending={banPending}
            unbanPending={unbanPending}
          />
        </div>
      </td>
    </tr>
  );
}

// ─── Sub-component: Table skeleton ───────────────────────────────────
function TableSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <tr key={i} className="border-b">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export const UserManagement = () => {
  const [tab, setTab] = useState<'all' | 'candidate' | 'mentor' | 'reported'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  // Filters: role từ tab (all = không filter role)
  const roleFilter = tab === 'candidate' ? 'CANDIDATE' : tab === 'mentor' ? 'MENTOR' : undefined;

  const { items, totalPages, total, isLoading } = useAdminUsers({
    page,
    limit: 15,
    role: tab === 'reported' ? undefined : roleFilter,
    search: debouncedSearch,
  });

  const { items: reportedItems, isLoading: reportedLoading } = useReportedUsers();

  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const handleBan = (user: AdminUser) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };
  const handleUnban = (user: AdminUser) => unbanMutation.mutate(user.id);

  const handleConfirmBan = (data: BanFormData) => {
    if (!selectedUser) return;
    banMutation.mutate({ id: selectedUser.id, data }, { onSuccess: () => setBanDialogOpen(false) });
  };

  const actionProps = {
    onBan: handleBan,
    onUnban: handleUnban,
    banPending: banMutation.isPending,
    unbanPending: unbanMutation.isPending,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem, khóa và mở khóa tài khoản người dùng
          </p>
        </div>
        {tab !== 'reported' && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            {total} người dùng
          </div>
        )}
      </div>

      {/* Search */}
      {tab !== 'reported' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v: any) => {
          setTab(v);
          setPage(1);
          setSearch('');
        }}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <Users className="h-4 w-4" /> Tất cả
          </TabsTrigger>
          <TabsTrigger value="candidate">Candidate</TabsTrigger>
          <TabsTrigger value="mentor">Mentor</TabsTrigger>
          <TabsTrigger value="reported" className="gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Bị báo cáo
          </TabsTrigger>
        </TabsList>

        {/* ── Tabs: all / candidate / mentor ── */}
        {(['all', 'candidate', 'mentor'] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Báo cáo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    items.map((user) => <UserRow key={user.id} user={user} {...actionProps} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
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
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}

        {/* ── Tab: reported ── */}
        <TabsContent value="reported" className="mt-4">
          {reportedLoading ? (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <TableSkeleton cols={6} />
                </tbody>
              </table>
            </div>
          ) : reportedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <ShieldAlert className="h-10 w-10 opacity-30" />
              <p>Không có user nào bị báo cáo</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Số báo cáo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Loại vi phạm
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Lý do gần nhất
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(reportedItems as ReportedUserItem[]).map((item) => {
                    const u = item.user;
                    const roleCfg = ROLE_CONFIG[u.role] ?? {
                      label: u.role,
                      className: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={u.avatarUrl ?? ''} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${roleCfg.className}`}>
                            {roleCfg.label}
                          </Badge>
                        </td>

                        {/* Report count */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {item.reportCount}
                          </span>
                        </td>

                        {/* Report types */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.reportTypes.slice(0, 3).map((rt) => (
                              <span
                                key={rt}
                                className="text-[11px] bg-orange-50 border border-orange-200 text-orange-700 rounded px-1.5 py-0.5"
                              >
                                {REPORT_TYPE_LABEL[rt] ?? rt}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Latest reason */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p
                            className="text-xs text-muted-foreground truncate"
                            title={item.latestReason}
                          >
                            {item.latestReason}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <UserActions user={u} {...actionProps} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ban dialog */}
      {selectedUser && (
        <BanUserDialog
          open={banDialogOpen}
          onClose={() => setBanDialogOpen(false)}
          onConfirm={handleConfirmBan}
          isLoading={banMutation.isPending}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
};
