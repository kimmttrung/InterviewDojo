// src/features/admin/questions/pages/QuestionForm.tsx
import { useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  useCreateQuestion,
  useUpdateQuestion,
  useAdminQuestionDetail,
} from '../hooks/useAdminQuestions';
import { useCategories } from '../hooks/useCategories';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useJobRoles } from '../../job-roles/hooks/useJobRoles';
import { RelationSelector } from '../components/RelationSelector';
import { TheorySection } from '../components/TheorySection';
import { CodingSection } from '../components/CodingSection';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Difficulty,
  QuestionType,
} from '@/features/shared-domain/question-bank/types/question.types';
import { CreateQuestionPayload } from '../types/question.types';
import { showToast } from '@/shared/lib/toast';
import { slugify } from '@/shared/lib/utils';
import { categoryApi } from '../api/categoryApi';
import { companyApi } from '../../companies';
import { jobRoleApi } from '../../job-roles';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Shape returned by questionAdminApi.getOne — loosely typed since the API
// returns a flattened DTO (categories/companies/jobRoles as string name arrays)
interface ExistingQuestion {
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isPublished: boolean;
  type: 'TECHNICAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL' | 'CODING';
  categories?: string[];
  companies?: string[];
  jobRoles?: string[];
  data?: { question: string; tips: string[]; followUps: string[]; keyPoints: string[] };
  codingData?: {
    description: string;
    constraints?: string;
    hints: string[];
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    codeforcesLink?: string;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      isSample: boolean;
      isHidden: boolean;
      points: number;
      order: number;
      explanation?: string;
    }>;
  };
}

// ==================== SCHEMAS ====================
const theoryDataSchema = z.object({
  question: z.string(),
  tips: z.array(z.string()),
  followUps: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

const codingDataSchema = z.object({
  description: z.string().min(1, 'Description không được để trống'),
  constraints: z.string().optional(),
  tags: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
  timeLimit: z.number(),
  memoryLimit: z.number(),
  codeforcesLink: z.string().optional(),
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isSample: z.boolean(),
      isHidden: z.boolean(),
      points: z.number(),
      order: z.number(),
      explanation: z.string().optional(),
    }),
  ),
});

const questionSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  isPublished: z.boolean(),
  categoryIds: z.array(z.number()),
  companyIds: z.array(z.number()),
  jobRoleIds: z.array(z.number()),
  type: z.enum(['TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'CODING']),
  theoryData: theoryDataSchema.optional(),
  codingData: codingDataSchema.optional(),
});

type FormValues = z.infer<typeof questionSchema>;

// ==================== DIFFICULTY BADGE COLORS ====================
const difficultyConfig = {
  EASY: { label: 'Easy', className: 'bg-green-100 text-green-700 border-green-200' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  HARD: { label: 'Hard', className: 'bg-red-100 text-red-700 border-red-200' },
};

// ==================== COMPONENT ====================

export const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const slugTouched = useRef(false);
  const lastResetId = useRef<string | undefined>(undefined);

  const { data: existing, isLoading: loadingDetail } = useAdminQuestionDetail(Number(id));
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();

  const categoriesQuery = useCategories();
  const companiesQuery = useCompanies();
  const jobRolesQuery = useJobRoles();

  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [];
  const companies = Array.isArray(companiesQuery.data) ? companiesQuery.data : [];
  const jobRoles = Array.isArray(jobRolesQuery.data) ? jobRolesQuery.data : [];

  // name → id maps for resolving existing question relations
  const categoryNameToId = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [categories]);

  const companyNameToId = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [companies]);

  const jobRoleNameToId = useMemo(() => {
    const map = new Map<string, number>();
    jobRoles.forEach((j) => map.set(j.name, j.id));
    return map;
  }, [jobRoles]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      slug: '',
      difficulty: Difficulty.MEDIUM,
      isPublished: false,
      categoryIds: [],
      companyIds: [],
      jobRoleIds: [],
      type: QuestionType.TECHNICAL,
      theoryData: { question: '', tips: [], followUps: [], keyPoints: [] },
      codingData: {
        description: '',
        constraints: '',
        hints: [],
        tags: [],
        timeLimit: 2000,
        memoryLimit: 256000,
        codeforcesLink: '',
        testCases: [],
      },
    },
  });

  const titleValue = watch('title');
  const typeValue = watch('type');

  // Auto-generate slug from title (only when user hasn't manually edited slug)
  useEffect(() => {
    if (!slugTouched.current && titleValue) {
      setValue('slug', slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, setValue]);

  // ── FIX: Two-phase reset ──────────────────────────────────────────────────
  // Phase 1: As soon as `existing` loads, reset the core fields (type, title,
  // slug, difficulty, isPublished, codingData, theoryData). This ensures the
  // correct section (CodingSection vs TheorySection) is shown immediately,
  // even if the lookup queries (categories/companies/jobRoles) haven't resolved yet.
  //
  // Phase 2: Once all lookups are ready, resolve the name→id maps and update
  // only the relation fields (categoryIds, companyIds, jobRoleIds).
  //
  // Previously, the single effect guarded on `lookups.isLoading`, so the entire
  // reset (including `type`) was deferred until all lookups finished. If lookups
  // were slow/uncached, the form stayed at defaultValues (type=TECHNICAL) and the
  // user saw the wrong section.

  // Phase 1 — reset core fields as soon as `existing` is available
  useEffect(() => {
    if (lastResetId.current === id) return;
    if (!isEdit || !existing) return;

    const q = existing as ExistingQuestion;

    reset({
      title: q.title,
      slug: q.slug,
      difficulty: q.difficulty,
      isPublished: q.isPublished,
      type: q.type,
      // Resolve relations to empty arrays for now — phase 2 will fill them in
      categoryIds: [],
      companyIds: [],
      jobRoleIds: [],
      theoryData: q.data || { question: '', tips: [], followUps: [], keyPoints: [] },
      codingData: q.codingData || {
        description: '',
        constraints: '',
        hints: [],
        tags: [],
        timeLimit: 2000,
        memoryLimit: 256000,
        codeforcesLink: '',
        testCases: [],
      },
    });

    lastResetId.current = id;
    slugTouched.current = true;
  }, [isEdit, existing, id, reset]);

  // Phase 2 — fill in relation IDs once lookups are ready
  useEffect(() => {
    if (!isEdit || !existing) return;
    if (categoriesQuery.isLoading || companiesQuery.isLoading || jobRolesQuery.isLoading) return;
    // Only run when maps are actually populated (avoids overwriting with empty arrays)
    if (!categories.length && !companies.length && !jobRoles.length) return;

    const q = existing as ExistingQuestion;
    const categoryIds = (q.categories || [])
      .map((name: string) => categoryNameToId.get(name))
      .filter(Boolean) as number[];
    const companyIds = (q.companies || [])
      .map((name: string) => companyNameToId.get(name))
      .filter(Boolean) as number[];
    const jobRoleIds = (q.jobRoles || [])
      .map((name: string) => jobRoleNameToId.get(name))
      .filter(Boolean) as number[];

    setValue('categoryIds', categoryIds);
    setValue('companyIds', companyIds);
    setValue('jobRoleIds', jobRoleIds);
  }, [
    isEdit,
    existing,
    categories,
    companies,
    jobRoles,
    categoriesQuery.isLoading,
    companiesQuery.isLoading,
    jobRolesQuery.isLoading,
    categoryNameToId,
    companyNameToId,
    jobRoleNameToId,
    setValue,
  ]);

  // validate + narrow raw form values → CreateQuestionPayload
  const onSubmit = (rawData: FormValues) => {
    // Normalize tags/hints: CodingSection uses comma-string inputs
    const normalizedData: FormValues = {
      ...rawData,
      codingData: rawData.codingData
        ? {
            ...rawData.codingData,
            tags: Array.isArray(rawData.codingData.tags)
              ? rawData.codingData.tags
              : String(rawData.codingData.tags ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
            hints: Array.isArray(rawData.codingData.hints)
              ? rawData.codingData.hints
              : String(rawData.codingData.hints ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
          }
        : undefined,
    };

    const result = questionSchema.safeParse(normalizedData);
    if (!result.success) {
      const firstError = result.error.issues[0];
      showToast.error(firstError?.message ?? 'Dữ liệu không hợp lệ');
      return;
    }

    const data = result.data;
    const base = {
      title: data.title,
      slug: data.slug,
      difficulty: data.difficulty as Difficulty,
      isPublished: data.isPublished,
      categoryIds: data.categoryIds,
      companyIds: data.companyIds,
      jobRoleIds: data.jobRoleIds,
    };

    const payload: CreateQuestionPayload =
      data.type === 'CODING'
        ? { ...base, type: 'CODING' as const, codingData: data.codingData! }
        : {
            ...base,
            type: data.type as Exclude<QuestionType, 'CODING'>,
            theoryData: data.theoryData ?? {
              question: '',
              tips: [],
              followUps: [],
              keyPoints: [],
            },
          };

    if (isEdit) {
      updateMutation.mutate(
        { id: Number(id), data: payload },
        { onSuccess: () => navigate('/admin/questions') },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/admin/questions') });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Loading state: only block render if we have no data yet ──────────────
  if (loadingDetail && isEdit) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải câu hỏi...</span>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 max-w-4xl mx-auto px-4 py-8 pb-24"
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/questions')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEdit ? `Đang sửa #${id}` : 'Điền thông tin bên dưới'}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="shrink-0">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo câu hỏi'}
          </Button>
        </div>

        {/* ── Section: Thông tin cơ bản ────────────────────────── */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-base">Thông tin cơ bản</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input id="title" {...register('title')} placeholder="Ví dụ: Two Sum" />
              {(errors as any).title && (
                <p className="text-xs text-destructive">{(errors as any).title.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="two-sum"
                onChange={(e) => {
                  slugTouched.current = true;
                  register('slug').onChange(e);
                }}
              />
              {(errors as any).slug && (
                <p className="text-xs text-destructive">{(errors as any).slug.message}</p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label>Độ khó *</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    {/* FIX: bg-background ensures dropdown is not transparent */}
                    <SelectContent className="bg-background border shadow-md">
                      {Object.entries(difficultyConfig).map(([val, cfg]) => (
                        <SelectItem key={val} value={val}>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${cfg.className}`}
                          >
                            {cfg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Loại câu hỏi *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    {/* FIX: bg-background ensures dropdown is not transparent */}
                    <SelectContent className="bg-background border shadow-md">
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="SYSTEM_DESIGN">System Design</SelectItem>
                      <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                      <SelectItem value="CODING">Coding</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3 pt-1">
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Switch id="isPublished" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              Xuất bản ngay
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (tắt = lưu nháp)
              </span>
            </Label>
          </div>
        </section>

        {/* ── Section: Quan hệ ─────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-base">Phân loại & Quan hệ</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Controller
                control={control}
                name="categoryIds"
                render={({ field }) => (
                  <RelationSelector
                    options={categories}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    entityName="danh mục"
                    onQuickAdd={async (name) => {
                      const res = await categoryApi.create({ name });
                      queryClient.setQueryData(['admin', 'categories'], (old: any[]) => [
                        ...(old || []),
                        res,
                      ]);
                      showToast.success('Thêm danh mục thành công');
                      return res;
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Công ty</Label>
              <Controller
                control={control}
                name="companyIds"
                render={({ field }) => (
                  <RelationSelector
                    options={companies}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    entityName="công ty"
                    onQuickAdd={async (name) => {
                      const res = await companyApi.create({ name });
                      queryClient.setQueryData(['admin', 'companies'], (old: any[]) => [
                        ...(old || []),
                        res,
                      ]);
                      showToast.success('Thêm công ty thành công');
                      return res;
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Vai trò công việc</Label>
              <Controller
                control={control}
                name="jobRoleIds"
                render={({ field }) => (
                  <RelationSelector
                    options={jobRoles}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    entityName="vai trò"
                    onQuickAdd={async (name) => {
                      const res = await jobRoleApi.create({ name });
                      queryClient.setQueryData(['admin', 'jobRoles'], (old: any[]) => [
                        ...(old || []),
                        res,
                      ]);
                      showToast.success('Thêm vai trò thành công');
                      return res;
                    }}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* ── Section: Nội dung câu hỏi ────────────────────────── */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Nội dung câu hỏi</h2>
            <Badge variant="outline" className="text-xs">
              {typeValue}
            </Badge>
          </div>

          {typeValue !== 'CODING' ? (
            <TheorySection register={register as any} control={control} />
          ) : (
            <CodingSection register={register as any} control={control} />
          )}
        </section>

        {/* ── Sticky bottom save bar ───────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex justify-end gap-3 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/questions')}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi'}
          </Button>
        </div>
      </form>
    </div>
  );
};
