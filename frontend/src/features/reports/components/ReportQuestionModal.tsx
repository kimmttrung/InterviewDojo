import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { useReportQuestion } from '../hooks/useReportQuestion';

// Các loại báo cáo cho câu hỏi (giữ nguyên value theo enum)
const REPORT_TYPES = [
  { value: 'WRONG_ANSWER', label: 'Wrong answer' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'DUPLICATE', label: 'Duplicate question' },
  { value: 'OTHER_QUESTION', label: 'Other' },
];

interface ReportQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: number;
  questionTitle: string;
}

export function ReportQuestionModal({
  open,
  onOpenChange,
  questionId,
  questionTitle,
}: ReportQuestionModalProps) {
  const [type, setType] = useState('OTHER_QUESTION');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const { mutate, isPending } = useReportQuestion();

  const handleSubmit = () => {
    if (!reason.trim()) return;

    const formData = new FormData();
    formData.append('targetType', 'QUESTION');
    formData.append('targetQuestionId', String(questionId));
    formData.append('snapshotQuestionTitle', questionTitle);
    formData.append('type', type);
    formData.append('reason', reason);
    if (files) {
      Array.from(files).forEach((file) => {
        formData.append('evidenceFiles', file);
      });
    }

    mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        setReason('');
        setType('OTHER_QUESTION');
        setFiles(null);
      },
    });
  };

  // Stop propagation to prevent card navigation when clicking inside modal
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onClick={handleContentClick} // 👈 blocks event bubbling
      >
        <DialogHeader>
          <DialogTitle>Report Question</DialogTitle>
          <DialogDescription>Please tell us why you are reporting this question.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report type</Label>
            <select
              id="report-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Reason (max 2000 characters)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              maxLength={2000}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Evidence (optional, images/videos)</Label>
            <Input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setFiles(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              You can upload up to 5 files (max 10MB each).
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !reason.trim()}>
            {isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
