import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminMentors } from '../hooks/useAdminMentors';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import { Search, ChevronRight, Building2, Briefcase, Clock } from 'lucide-react';

type ApprovalStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INCOMPLETE' | 'SUSPENDED';

interface Experience {
  id: number;
  isCurrent: boolean;
  startDate: string;
  endDate: string | null;
  company: { id: number; name: string; logoUrl: string | null; industry: string | null };
  jobRole: { id: number; name: string };
  description: string | null;
}

interface MentorListItem {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  experienceYears: number;
  createdAt: string;
  mentorProfile?: {
    headline: string;
    approvalStatus: ApprovalStatus;
    experiences: Experience[];
    coachingPlans: { id: number; title: string; price: number }[];
  };
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ACTIVE: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800 border-red-200' },
  INCOMPLETE: { label: 'Chưa hoàn tất', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  SUSPENDED: { label: 'Tạm khóa', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

export const MentorApprovalList = () => {
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: response, isLoading } = useAdminMentors({ status, page, limit: 10 });
  const navigate = useNavigate();

  const payload = response?.data?.data;
  const allItems: MentorListItem[] = payload?.items ?? [];
  const totalPages: number = payload?.meta?.totalPages ?? 1;
  const total: number = payload?.meta?.total ?? 0;

  const items = search
    ? allItems.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()) ||
          m.mentorProfile?.headline?.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  const TAB_STATUS: { value: string; label: string; count?: number }[] = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'ACTIVE', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Duyệt Mentor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Xem xét và phê duyệt hồ sơ đăng ký mentor
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          {total} mentor trong tab này
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, email, headline..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs
        value={status}
        onValueChange={(val) => {
          setStatus(val);
          setPage(1);
          setSearch('');
        }}
      >
        <TabsList>
          {TAB_STATUS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_STATUS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {isLoading ? (
              <div className="grid gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Briefcase className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Không có mentor nào</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((mentor) => {
                  const profile = mentor.mentorProfile;
                  const statusCfg = STATUS_CONFIG[profile?.approvalStatus ?? 'INCOMPLETE'];
                  const currentExp =
                    profile?.experiences?.find((e) => e.isCurrent) ?? profile?.experiences?.[0];

                  return (
                    <div
                      key={mentor.id}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/admin/mentors/${mentor.id}`)}
                    >
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={mentor.avatarUrl ?? ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {getInitials(mentor.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{mentor.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {mentor.email}
                        </p>
                        {profile?.headline && (
                          <p className="text-xs text-foreground/70 truncate mt-0.5">
                            {profile.headline}
                          </p>
                        )}
                        {/* Current experience */}
                        {currentExp && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {currentExp.company.logoUrl ? (
                              <img
                                src={currentExp.company.logoUrl}
                                alt=""
                                className="h-4 w-4 rounded object-contain"
                              />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {currentExp.jobRole.name} @ {currentExp.company.name}
                              {currentExp.isCurrent && (
                                <span className="ml-1 text-green-600 font-medium">· Hiện tại</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{profile?.coachingPlans?.length ?? 0} gói coaching</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(mentor.createdAt)}</span>
                        </div>
                        <span className="text-foreground/50">{mentor.experienceYears} năm KN</span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
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
      </Tabs>
    </div>
  );
};
