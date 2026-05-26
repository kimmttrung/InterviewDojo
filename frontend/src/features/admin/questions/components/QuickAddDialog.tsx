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
import { useState } from 'react';
import { showToast } from '@/shared/lib/toast';

interface QuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<any>;
  title: string;
  label: string;
  placeholder?: string;
}

export const QuickAddDialog = ({
  open,
  onClose,
  onSave,
  title,
  label,
  placeholder,
}: QuickAddDialogProps) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onSave(name);
      setName('');
      onClose();
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label>{label}</Label>
          <Input placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
