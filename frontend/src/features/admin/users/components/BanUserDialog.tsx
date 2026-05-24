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
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { BanFormData } from '../types/user.types';

// ─── Schema ───────────────────────────────────────────────
const banSchema = z
  .object({
    duration: z.enum(['PERMANENT', 'TEMPORARY']),
    days: z.number().min(1, 'Tối thiểu 1 ngày').optional().nullable(),
    reason: z.string().min(1, 'Vui lòng nhập lý do'),
  })
  .refine((d) => d.duration !== 'TEMPORARY' || (d.days && d.days >= 1), {
    message: 'Vui lòng nhập số ngày hợp lệ',
    path: ['days'],
  });

type BanFormValues = z.infer<typeof banSchema>;

// ─── Props ────────────────────────────────────────────────
interface BanUserDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: BanFormData) => void;
  isLoading: boolean;
  userName: string;
}

// ─── Component ───────────────────────────────────────────
export const BanUserDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading,
  userName,
}: BanUserDialogProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BanFormValues>({
    resolver: zodResolver(banSchema),
    defaultValues: { duration: 'PERMANENT', days: null, reason: '' },
  });

  const duration = watch('duration');

  // Reset form mỗi khi dialog mở
  useEffect(() => {
    if (open) reset({ duration: 'PERMANENT', days: null, reason: '' });
  }, [open, reset]);

  const onSubmit = (values: BanFormValues) => {
    onConfirm({
      duration: values.duration,
      days: values.duration === 'TEMPORARY' ? (values.days ?? undefined) : undefined,
      reason: values.reason,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isLoading && !v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Khóa tài khoản: <span className="text-destructive">{userName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Duration */}
          <div className="space-y-2">
            <Label>Loại khóa</Label>
            <RadioGroup
              value={duration}
              onValueChange={(v) => setValue('duration', v as 'PERMANENT' | 'TEMPORARY')}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="PERMANENT" id="perm" />
                <Label htmlFor="perm" className="cursor-pointer">
                  Vĩnh viễn
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="TEMPORARY" id="temp" />
                <Label htmlFor="temp" className="cursor-pointer">
                  Tạm thời
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Days — chỉ hiện khi TEMPORARY */}
          {duration === 'TEMPORARY' && (
            <div className="space-y-1">
              <Label htmlFor="days">Số ngày khóa</Label>
              <Input
                id="days"
                type="number"
                min={1}
                placeholder="VD: 7"
                {...register('days', { valueAsNumber: true })}
              />
              {errors.days && <p className="text-sm text-destructive">{errors.days.message}</p>}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <Label htmlFor="reason">Lý do khóa</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Nhập lý do khóa tài khoản..."
              {...register('reason')}
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {duration === 'PERMANENT'
                ? 'Hành động này sẽ ngăn người dùng đăng nhập vĩnh viễn. Chỉ admin mới có thể mở lại.'
                : 'Tài khoản sẽ tự động mở khóa sau thời gian khóa.'}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Xác nhận khóa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
