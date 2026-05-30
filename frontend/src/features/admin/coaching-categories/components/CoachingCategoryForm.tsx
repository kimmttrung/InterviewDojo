// src/features/admin/coaching-categories/components/CoachingCategoryForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CoachingCategory } from '../types/coaching-category.types';

const schema = z.object({
  slug: z
    .string()
    .min(1, 'Slug không được để trống')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số, dấu gạch ngang'),
  name: z.string().min(1, 'Tên không được để trống'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: CoachingCategory | null;
  onSuccess: (data?: any) => void;
  isLoading?: boolean;
}

export const CoachingCategoryForm = ({
  open,
  onOpenChange,
  editingCategory,
  onSuccess,
  isLoading = false,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { slug: '', name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        reset({
          slug: editingCategory.slug,
          name: editingCategory.name,
          description: editingCategory.description || '',
        });
      } else {
        reset({ slug: '', name: '', description: '' });
      }
    }
  }, [open, editingCategory, reset]);

  const onSubmit = (data: FormValues) => {
    if (editingCategory) {
      onSuccess({ ...data, id: editingCategory.id });
    } else {
      onSuccess(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" placeholder="vi-du-slug" {...register('slug')} />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">
              Chỉ chứa chữ thường, số, dấu gạch ngang.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Tên *</Label>
            <Input id="name" placeholder="Ví dụ: Technical Interview" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Mô tả danh mục..."
              {...register('description')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : editingCategory ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
