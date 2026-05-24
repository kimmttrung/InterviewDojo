import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface RejectMentorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const rejectSchema = z.object({ reason: z.string().min(1, 'Vui lòng nhập lý do') });

export const RejectMentorDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading,
}: RejectMentorDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rejectSchema),
  });
  const onSubmit = (data: any) => onConfirm(data.reason);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isLoading && !v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lý do từ chối</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={isLoading ? 'pointer-events-none opacity-80' : ''}
        >
          <Textarea {...register('reason')} placeholder="Nhập lý do..." />
          {errors.reason && <p className="text-red-500 text-sm">{errors.reason.message}</p>}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
