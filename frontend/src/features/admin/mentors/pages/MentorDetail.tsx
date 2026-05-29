import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMentorDetail, useApproveMentor, useRejectMentor } from '../hooks/useAdminMentors';
import { RejectMentorDialog } from '../components/RejectMentorDialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Building2,
  Briefcase,
  Github,
  Linkedin,
  Mail,
  Clock,
  BookOpen,
  Star,
  CalendarDays,
  ExternalLink,
  Video,
  User,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

// ==================== TYPES ====================
type ApprovalStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INCOMPLETE' | 'SUSPENDED';
type SkillType = 'SOFTSKILL' | 'HARDSKILL' | 'LANGUAGE';
type SkillLevel = 'LEARNING' | 'PRACTICED' | 'PERSONAL_PROJECT' | 'PRODUCTION_READY' | 'EXPERT';

interface Experience {
  id: number;
  isCurrent: boolean;
  startDate: string;
  endDate: string | null;
  description: string | null;
  proofUrl?: string | null;
  company: { id: number; name: string; logoUrl: string | null; industry: string | null } | null;
  jobRole: { id: number; name: string; description: string | null } | null;
}

interface CoachingQuestion {
  id: number;
  question: string;
  type: string;
  placeholder?: string | null;
  isRequired: boolean;
  orderIndex: number;
}

interface CoachingPlan {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  isActive?: boolean;
  questions: CoachingQuestion[];
}

interface Skill {
  id: number;
  name: string;
  type: SkillType;
  level: SkillLevel;
  experienceMonths: number;
  proofUrl: string | null;
}

interface MentorData {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  experienceYears: number;
  linkedInLink: string | null;
  githubLink: string | null;
  createdAt: string;
  mentorProfile: {
    id: number;
    headline: string;
    approvalStatus: ApprovalStatus;
    introductionVideoUrl: string | null;
    experiences: Experience[];
    coachingPlans: CoachingPlan[];
  };
  skills: Skill[];
}

// ==================== CONFIG / HELPERS ====================
const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; badgeClass: string; bannerClass: string; bannerText: string }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bannerClass: 'bg-yellow-50 border-yellow-200',
    bannerText: 'Hồ sơ đang chờ xét duyệt — xem xét đầy đủ thông tin trước khi quyết định.',
  },
  ACTIVE: {
    label: 'Đã duyệt',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    bannerClass: 'bg-green-50 border-green-200',
    bannerText: 'Mentor này đã được duyệt và đang hoạt động.',
  },
  REJECTED: {
    label: 'Từ chối',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    bannerClass: 'bg-red-50 border-red-200',
    bannerText: 'Hồ sơ này đã bị từ chối.',
  },
  INCOMPLETE: {
    label: 'Chưa hoàn tất',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    bannerClass: 'bg-gray-50 border-gray-200',
    bannerText: 'Mentor chưa hoàn tất hồ sơ đăng ký.',
  },
  SUSPENDED: {
    label: 'Tạm khóa',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    bannerClass: 'bg-orange-50 border-orange-200',
    bannerText: 'Tài khoản mentor đang bị tạm khóa.',
  },
};

const SKILL_LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; stars: number }> = {
  LEARNING: { label: 'Đang học', color: 'bg-gray-100 text-gray-700 border-gray-200', stars: 1 },
  PRACTICED: {
    label: 'Đã thực hành',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    stars: 2,
  },
  PERSONAL_PROJECT: {
    label: 'Dự án cá nhân',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    stars: 3,
  },
  PRODUCTION_READY: {
    label: 'Production ready',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    stars: 4,
  },
  EXPERT: { label: 'Chuyên gia', color: 'bg-amber-100 text-amber-700 border-amber-200', stars: 5 },
};

const SKILL_TYPE_ORDER: SkillType[] = ['HARDSKILL', 'SOFTSKILL', 'LANGUAGE'];
const SKILL_TYPE_LABEL: Record<SkillType, string> = {
  HARDSKILL: 'Kỹ năng chuyên môn',
  SOFTSKILL: 'Kỹ năng mềm',
  LANGUAGE: 'Ngôn ngữ',
};

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
}
function fmtFull(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function dateRange(start: string, end: string | null, isCurrent: boolean) {
  return `${fmtMonth(start)} – ${isCurrent ? 'Hiện tại' : end ? fmtMonth(end) : '?'}`;
}
function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

// ==================== SECTION CARD ====================
function SectionCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          {count !== undefined && (
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ==================== MAIN ====================
export const MentorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useMentorDetail(Number(id));
  const approveMutation = useApproveMentor();
  const rejectMutation = useRejectMentor();
  const [rejectOpen, setRejectOpen] = useState(false);

  // ---------- loading ----------
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl animate-pulse">
        <div className="h-8 w-36 bg-muted rounded" />
        <div className="h-52 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-44 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
        </div>
        <div className="h-36 bg-muted rounded-xl" />
      </div>
    );
  }

  // ---------- error ----------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <XCircle className="h-12 w-12 text-destructive/60" />
        <p className="font-medium">Không thể tải thông tin mentor</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </div>
    );
  }

  // Backend: { success, data: <mentor>, message }  →  Axios wraps in .data
  const mentor = response?.data?.data as MentorData | undefined;
  if (!mentor) {
    return <div className="p-6 text-muted-foreground">Không tìm thấy mentor.</div>;
  }

  const profile = mentor.mentorProfile;
  const status = profile?.approvalStatus ?? 'INCOMPLETE';
  const statusCfg = STATUS_CONFIG[status];
  const isPending = status === 'PENDING';
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const skills = mentor.skills ?? [];
  const experiences = profile?.experiences ?? [];
  const coachingPlans = profile?.coachingPlans ?? [];

  const handleApprove = () => approveMutation.mutate(Number(id));
  const handleReject = (reason: string) =>
    rejectMutation.mutate({ id: Number(id), reason }, { onSuccess: () => setRejectOpen(false) });

  // group skills by type, preserve defined order
  const skillsByType = SKILL_TYPE_ORDER.reduce<Record<string, Skill[]>>((acc, t) => {
    const group = skills.filter((s) => s.type === t);
    if (group.length) acc[t] = group;
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-4xl pb-10">
      {/* ── back ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin/mentors')}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách mentor
      </Button>

      {/* ══════════════════════════════════════
          HERO CARD
      ══════════════════════════════════════ */}
      <Card className="overflow-hidden">
        {/* gradient strip */}
        <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />

        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* avatar */}
            <Avatar className="h-20 w-20 border-4 border-background shadow-md shrink-0">
              <AvatarImage src={mentor.avatarUrl ?? ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {getInitials(mentor.name)}
              </AvatarFallback>
            </Avatar>

            {/* name + headline */}
            <div className="flex-1 min-w-0 pb-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold leading-tight">{mentor.name}</h2>
                <Badge variant="outline" className={`text-xs ${statusCfg.badgeClass}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              {profile?.headline && (
                <p className="text-sm text-muted-foreground">{profile.headline}</p>
              )}
              {/* meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {mentor.email}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {mentor.experienceYears} năm KN
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Tham gia {fmtFull(mentor.createdAt)}
                </span>
              </div>
              {/* social links */}
              <div className="flex gap-2 pt-0.5">
                {mentor.linkedInLink && (
                  <a
                    href={mentor.linkedInLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {mentor.githubLink && (
                  <a
                    href={mentor.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/60 hover:text-foreground transition-colors"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* action buttons (top, for pending) */}
            {isPending && (
              <div className="flex gap-2 shrink-0 sm:pb-1">
                <Button size="sm" onClick={handleApprove} disabled={isMutating} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {approveMutation.isPending ? 'Đang xử lý...' : 'Duyệt'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={isMutating}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </Button>
              </div>
            )}
          </div>

          {/* bio */}
          {mentor.bio && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">{mentor.bio}</p>
              </div>
            </>
          )}

          {/* intro video */}
          {profile?.introductionVideoUrl && (
            <>
              <Separator className="my-4" />
              <a
                href={profile.introductionVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <Video className="h-4 w-4" />
                Xem video giới thiệu
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════
          STATUS BANNER
      ══════════════════════════════════════ */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${statusCfg.bannerClass}`}>
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1 text-sm">{statusCfg.bannerText}</div>
        {isPending && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isMutating}
              className="gap-1.5 h-7 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {approveMutation.isPending ? 'Đang xử lý...' : 'Duyệt'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              disabled={isMutating}
              className="gap-1.5 h-7 text-xs"
            >
              <XCircle className="h-3.5 w-3.5" />
              Từ chối
            </Button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          EXPERIENCE + SKILLS  (2 cols)
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Kinh nghiệm ── */}
        <SectionCard
          title="Kinh nghiệm làm việc"
          icon={<Building2 className="h-4 w-4" />}
          count={experiences.length}
        >
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Chưa có kinh nghiệm.</p>
          ) : (
            <div className="space-y-5">
              {experiences.map((exp, idx) => (
                <div key={exp.id}>
                  <div className="flex gap-3">
                    {/* company logo */}
                    <div className="shrink-0 mt-0.5">
                      {exp.company?.logoUrl ? (
                        <img
                          src={exp.company.logoUrl}
                          alt={exp.company.name}
                          className="h-9 w-9 rounded-lg object-contain border bg-white p-0.5"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* role */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm">{exp.jobRole?.name ?? '—'}</span>
                        {exp.isCurrent && (
                          <span className="text-[11px] font-medium text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-full">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      {/* company */}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exp.company?.name ?? '—'}
                        {exp.company?.industry ? ` · ${exp.company.industry}` : ''}
                      </p>
                      {/* date range */}
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {dateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                      </p>
                      {/* description */}
                      {exp.description && (
                        <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                      {/* proof */}
                      {exp.proofUrl && (
                        <a
                          href={exp.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Xem bằng chứng
                        </a>
                      )}
                    </div>
                  </div>
                  {idx < experiences.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Kỹ năng ── */}
        <SectionCard title="Kỹ năng" icon={<Star className="h-4 w-4" />} count={skills.length}>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Chưa có kỹ năng.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(skillsByType).map(([type, group]) => (
                <div key={type}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {SKILL_TYPE_LABEL[type as SkillType]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.map((skill) => {
                      const lvl = SKILL_LEVEL_CONFIG[skill.level] ?? SKILL_LEVEL_CONFIG.LEARNING;
                      return (
                        <div key={skill.id} className="group relative">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium cursor-default ${lvl.color}`}
                          >
                            {skill.name}
                            <span className="text-[10px] opacity-50 tracking-tighter">
                              {'★'.repeat(lvl.stars)}
                              {'☆'.repeat(5 - lvl.stars)}
                            </span>
                          </span>
                          {/* hover tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                            <div className="bg-popover border shadow-lg rounded-xl p-3 text-xs w-48 space-y-1">
                              <p className="font-semibold">{skill.name}</p>
                              <p className="text-muted-foreground">{lvl.label}</p>
                              <p className="text-muted-foreground">
                                {skill.experienceMonths >= 12
                                  ? `${Math.floor(skill.experienceMonths / 12)} năm ${skill.experienceMonths % 12 ? `${skill.experienceMonths % 12} tháng` : ''}`
                                  : `${skill.experienceMonths} tháng`}
                              </p>
                              {skill.proofUrl && (
                                <p className="text-primary pointer-events-auto">
                                  <a
                                    href={skill.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Xem bằng chứng
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ══════════════════════════════════════
          COACHING PLANS
      ══════════════════════════════════════ */}
      <SectionCard
        title="Gói Coaching"
        icon={<BookOpen className="h-4 w-4" />}
        count={coachingPlans.length}
      >
        {coachingPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Chưa có gói coaching.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coachingPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors p-4 space-y-2"
              >
                {/* title + price */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug flex-1">{plan.title}</p>
                  <span className="shrink-0 font-bold text-sm text-primary flex items-center gap-0.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {plan.price}
                  </span>
                </div>

                {/* meta chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background border rounded-full px-2 py-0.5">
                    <Clock className="h-3 w-3" /> {plan.duration} phút
                  </span>
                  {plan.isActive !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${plan.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                      {plan.isActive ? 'Đang mở' : 'Tạm dừng'}
                    </span>
                  )}
                </div>

                {/* description */}
                {plan.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {plan.description}
                  </p>
                )}

                {/* questions */}
                {plan.questions?.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" /> Câu hỏi đặt lịch ({plan.questions.length})
                    </p>
                    <ul className="space-y-1">
                      {plan.questions.map((q) => (
                        <li
                          key={q.id}
                          className="flex items-start gap-1.5 text-xs text-foreground/75"
                        >
                          <span className="shrink-0 text-muted-foreground min-w-[16px]">
                            {q.orderIndex + 1}.
                          </span>
                          <span>
                            {q.question}
                            {q.isRequired && (
                              <span className="text-red-500 ml-0.5 font-bold">*</span>
                            )}
                            <span className="ml-1 text-[10px] text-muted-foreground bg-muted rounded px-1">
                              {q.type}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════
          REJECT DIALOG
      ══════════════════════════════════════ */}
      <RejectMentorDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
};
