// src/features/admin/questions/pages/QuestionForm.tsx
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateQuestion,
  useUpdateQuestion,
  useAdminQuestionDetail,
} from '../hooks/useAdminQuestions';
import { useCategories } from '../hooks/useCategories';
import { useCompanies } from '../hooks/useCompanies';
import { useJobRoles } from '../hooks/useJobRoles';
import { RelationSelector } from '../components/RelationSelector';
import { TheorySection } from '../components/TheorySection';
import { CodingSection } from '../components/CodingSection';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
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
import { showToast } from '@/shared/lib/toast';
import { slugify } from '@/shared/lib/utils';
import { categoryApi } from '../api/categoryApi';
import { companyApi } from '../api/companyApi';
import { jobRoleApi } from '../api/jobRoleApi';

// ==================== SCHEMAS (giữ nguyên) ====================
const theoryDataSchema = z.object({
  question: z.string(),
  tips: z.array(z.string()),
  followUps: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

const theorySchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  isPublished: z.boolean(),
  categoryIds: z.array(z.number()),
  companyIds: z.array(z.number()),
  jobRoleIds: z.array(z.number()),
  type: z.enum(['TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL']),
  theoryData: theoryDataSchema,
  codingData: z.any().optional(),
});

const codingDataSchema = z.object({
  description: z.string().min(1, 'Description không được để trống'),
  constraints: z.string().optional(),
  tags: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string())),
  hints: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string())),
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

const codingSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  isPublished: z.boolean(),
  categoryIds: z.array(z.number()),
  companyIds: z.array(z.number()),
  jobRoleIds: z.array(z.number()),
  type: z.literal('CODING'),
  codingData: codingDataSchema,
  theoryData: z.any().optional(),
});

const questionSchema = z.discriminatedUnion('type', [theorySchema, codingSchema]);
type FormValues = z.infer<typeof questionSchema>;

export const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const slugTouched = useRef(false);
  const hasReset = useRef(false); // đánh dấu đã reset

  const { data: existing, isLoading: loadingDetail } = useAdminQuestionDetail(Number(id));
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();

  const categoriesQuery = useCategories();
  console.log('🔍 Categories data:', categoriesQuery);
  const companiesQuery = useCompanies();
  const jobRolesQuery = useJobRoles();

  // Lấy dữ liệu an toàn (mảng)
  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [];
  const companies = Array.isArray(companiesQuery.data) ? companiesQuery.data : [];
  const jobRoles = Array.isArray(jobRolesQuery.data) ? jobRolesQuery.data : [];

  // Map name -> id (chỉ tạo khi có dữ liệu)
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

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(questionSchema),
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

  // Auto generate slug
  useEffect(() => {
    if (!slugTouched.current && titleValue) {
      setValue('slug', slugify(titleValue));
    }
  }, [titleValue, setValue]);

  // Reset form khi có dữ liệu existing và các options đã sẵn sàng
  useEffect(() => {
    // Chỉ reset nếu chưa reset, có existing, và các options không rỗng? (hoặc đã có map)
    if (hasReset.current) return;
    if (!isEdit || !existing) return;
    // Chờ categories, companies, jobRoles được load (không cần chờ hết vì có thể không có dữ liệu)
    if (categoriesQuery.isLoading || companiesQuery.isLoading || jobRolesQuery.isLoading) return;

    const categoryIds = (existing.categories || [])
      .map((name: string) => categoryNameToId.get(name))
      .filter(Boolean) as number[];
    const companyIds = (existing.companies || [])
      .map((name: string) => companyNameToId.get(name))
      .filter(Boolean) as number[];
    const jobRoleIds = (existing.jobRoles || [])
      .map((name: string) => jobRoleNameToId.get(name))
      .filter(Boolean) as number[];

    reset({
      title: existing.title,
      slug: existing.slug,
      difficulty: existing.difficulty,
      isPublished: existing.isPublished,
      categoryIds,
      companyIds,
      jobRoleIds,
      type: existing.type,
      theoryData: existing.data || { question: '', tips: [], followUps: [], keyPoints: [] },
      codingData: existing.codingData || {
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
    hasReset.current = true;
  }, [
    isEdit,
    existing,
    reset,
    categoryNameToId,
    companyNameToId,
    jobRoleNameToId,
    categoriesQuery.isLoading,
    companiesQuery.isLoading,
    jobRolesQuery.isLoading,
  ]);

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(
        { id: Number(id), data },
        { onSuccess: () => navigate('/admin/questions') },
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => navigate('/admin/questions') });
    }
  };

  const isLoadingOptions =
    categoriesQuery.isLoading || companiesQuery.isLoading || jobRolesQuery.isLoading;
  if (loadingDetail && isEdit) return <div className="p-6">Đang tải câu hỏi...</div>;
  if (isLoadingOptions && isEdit) return <div className="p-6">Đang tải danh mục...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* ... phần render giữ nguyên như cũ ... */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h1>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tiêu đề</Label>
          <Input {...register('title')} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            {...register('slug')}
            onChange={(e) => {
              slugTouched.current = true;
              register('slug').onChange(e);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Độ khó</Label>
          <Select
            onValueChange={(val) => setValue('difficulty', val as any)}
            value={watch('difficulty')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Loại</Label>
          <Select onValueChange={(val) => setValue('type', val as any)} value={watch('type')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TECHNICAL">Technical</SelectItem>
              <SelectItem value="SYSTEM_DESIGN">System Design</SelectItem>
              <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
              <SelectItem value="CODING">Coding</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label>Xuất bản</Label>
        <Switch
          checked={watch('isPublished')}
          onCheckedChange={(val) => setValue('isPublished', val)}
        />
      </div>

      <div className="space-y-4">
        <Label>Danh mục</Label>
        <RelationSelector
          options={categories}
          selectedIds={watch('categoryIds')}
          onChange={(ids) => setValue('categoryIds', ids)}
          entityName="danh mục"
          onQuickAdd={async (name) => {
            const res = await categoryApi.create({ name });
            showToast.success('Thêm danh mục thành công');
            return res;
          }}
        />
        <Label>Công ty</Label>
        <RelationSelector
          options={companies}
          selectedIds={watch('companyIds')}
          onChange={(ids) => setValue('companyIds', ids)}
          entityName="công ty"
          onQuickAdd={async (name) => {
            const res = await companyApi.create({ name });
            showToast.success('Thêm công ty thành công');
            return res;
          }}
        />
        <Label>Vai trò công việc</Label>
        <RelationSelector
          options={jobRoles}
          selectedIds={watch('jobRoleIds')}
          onChange={(ids) => setValue('jobRoleIds', ids)}
          entityName="vai trò"
          onQuickAdd={async (name) => {
            const res = await jobRoleApi.create({ name });
            showToast.success('Thêm vai trò thành công');
            return res;
          }}
        />
      </div>

      {typeValue !== 'CODING' && <TheorySection register={register as any} control={control} />}
      {typeValue === 'CODING' && <CodingSection register={register as any} control={control} />}
    </form>
  );
};
