import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { status: 'RESOLVED' | 'REJECTED'; adminNote?: string }) => void;
  isLoading: boolean;
}

export const UpdateStatusDialog = ({ open, onClose, onSubmit, isLoading }: Props) => {
  const [status, setStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [adminNote, setAdminNote] = useState('');

  const handleSubmit = () => {
    onSubmit({ status, adminNote: adminNote.trim() || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xử lý report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <RadioGroup
            value={status}
            onValueChange={(v: any) => setStatus(v)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="RESOLVED" id="resolved" />
              <Label htmlFor="resolved">Đã giải quyết</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="REJECTED" id="rejected" />
              <Label htmlFor="rejected">Từ chối</Label>
            </div>
          </RadioGroup>
          <div>
            <Label>Ghi chú (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Nhập ghi chú xử lý..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
