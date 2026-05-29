import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const REASON_OPTIONS = [
  { value: 'SPAM', label: 'Spam hoặc quảng cáo' },
  { value: 'HATE_SPEECH', label: 'Ngôn từ thô tục, thù ghét' },
  { value: 'HARASSMENT_COMMENT', label: 'Quấy rối, công kích cá nhân' },
];

export const ReportCommentModal: React.FC<Props> = ({ open, onClose, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = () => {
    const finalReason = reason === 'Khác' ? customReason : reason;
    if (!finalReason.trim()) return;
    onSubmit(finalReason);
    setReason('');
    setCustomReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo bình luận</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Vui lòng cho biết lý do bạn báo cáo bình luận này. Admin sẽ xem xét và xử lý.
          </p>
          <div className="space-y-2">
            {REASON_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          {reason === 'Khác' && (
            <Textarea
              placeholder="Nhập lý do cụ thể..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || (reason === 'Khác' && !customReason.trim()) || isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
