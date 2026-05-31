// src/features/admin/wallet/components/AdjustBalanceModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAdminAdjustBalance } from '../hooks/useAdminAdjustBalance';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface AdjustBalanceModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  currentBalance: number;
  onSuccess?: () => void;
}

export const AdjustBalanceModal = ({
  open,
  onClose,
  userId,
  userName,
  currentBalance,
  onSuccess,
}: AdjustBalanceModalProps) => {
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [rawAmount, setRawAmount] = useState('');
  const [note, setNote] = useState('');
  const mutation = useAdminAdjustBalance();

  const amount = Number(rawAmount) || 0;
  const finalAmount = mode === 'subtract' ? -amount : amount;
  const projectedBalance = currentBalance + finalAmount;

  const handleClose = () => {
    setMode('add');
    setRawAmount('');
    setNote('');
    onClose();
  };

  const handleSubmit = () => {
    if (amount <= 0) return;
    if (note.trim().length < 5) return;

    mutation.mutate(
      { userId, amount: finalAmount, note: note.trim() },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
      },
    );
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số dư ví</DialogTitle>
          <DialogDescription>
            Người dùng: <span className="font-medium text-foreground">{userName}</span>
            {' · '}Số dư hiện tại:{' '}
            <span className="font-medium text-foreground">{formatVND(currentBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'add' ? 'default' : 'outline'}
              className={mode === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setMode('add')}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Cộng tiền
            </Button>
            <Button
              type="button"
              variant={mode === 'subtract' ? 'default' : 'outline'}
              className={mode === 'subtract' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setMode('subtract')}
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Trừ tiền
            </Button>
          </div>

          {/* Amount */}
          <div>
            <Label>Số tiền (VNĐ)</Label>
            <Input
              type="number"
              value={rawAmount}
              onChange={(e) => setRawAmount(e.target.value)}
              placeholder="VD: 100000"
              min={1}
              className="mt-1"
            />
          </div>

          {/* Projected balance preview */}
          {amount > 0 && (
            <div className="bg-muted rounded-lg p-3 text-sm flex justify-between">
              <span className="text-muted-foreground">Số dư sau điều chỉnh:</span>
              <span
                className={`font-semibold ${
                  projectedBalance < 0 ? 'text-red-500' : 'text-foreground'
                }`}
              >
                {formatVND(projectedBalance)}
                {projectedBalance < 0 && ' ⚠ Âm'}
              </span>
            </div>
          )}

          {/* Note */}
          <div>
            <Label>
              Lý do <span className="text-muted-foreground text-xs">(tối thiểu 5 ký tự)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Bù credit do lỗi hệ thống ngày ..., chi tiet ma loi ..."
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending || amount <= 0 || note.trim().length < 5 || projectedBalance < 0
            }
            className={mode === 'subtract' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
