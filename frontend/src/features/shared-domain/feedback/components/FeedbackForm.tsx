// shared-domain/feedback/components/FeedbackForm.tsx
import { useState } from 'react';
import { StarRating } from 'react-awesome-stars';
import { QuickTagsSelector } from './QuickTagsSelector';
import { useSubmitFeedback } from '../hooks/useFeedback';
import { toast } from 'sonner';
import { FeedbackMode, FeedbackRequest } from '../types/feedback.types';

interface Props {
  mode: FeedbackMode;
  sessionId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FeedbackForm = ({ mode, sessionId, onSuccess, onCancel }: Props) => {
  const [form, setForm] = useState<FeedbackRequest>({
    overallScore: 0,
    quickTags: [],
    strengths: '',
    weaknesses: '',
    suggestions: '',
    comment: '',
  });
  const { mutate, isPending } = useSubmitFeedback(sessionId);

  const handleRating = (rate: number) => setForm((prev) => ({ ...prev, overallScore: rate }));

  const handleSubmit = () => {
    if (form.overallScore === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (mode === 'P2P' && !form.strengths && !form.weaknesses && !form.suggestions) {
      toast.error('Vui lòng nhập ít nhất một nhận xét');
      return;
    }
    mutate(form, {
      onSuccess: () => {
        toast.success('Gửi đánh giá thành công!');
        onSuccess?.();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Gửi thất bại');
      },
    });
  };

  // Textarea nhỏ hơn: rows=2, padding nhẹ, font nhỏ
  const renderTextarea = (
    label: string,
    field: keyof Pick<FeedbackRequest, 'strengths' | 'weaknesses' | 'suggestions' | 'comment'>,
    placeholder: string,
  ) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={2}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-y"
        value={form[field] || ''}
        onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Đánh giá sau buổi</h2>

      {/* Rating ngang: dùng flex row */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-gray-700">Đánh giá tổng quan (1-5 sao):</span>
        <div style={{ display: 'inline-flex' }}>
          <StarRating
            rating={form.overallScore}
            onRatingChange={handleRating}
            allowHalf={true} // 🔥 Đây mới là prop đúng
            size={28}
          />
        </div>
      </div>

      {/* Quick tags (chỉ cho Candidate → Mentor) */}
      {mode === 'CANDIDATE_TO_MENTOR' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn nhanh điểm mạnh của Mentor
          </label>
          <QuickTagsSelector
            selected={form.quickTags || []}
            onChange={(tags) => setForm((prev) => ({ ...prev, quickTags: tags }))}
          />
        </div>
      )}

      {/* 3 khung nhỏ cho P2P và Mentor → Candidate */}
      {(mode === 'P2P' || mode === 'MENTOR_TO_CANDIDATE') && (
        <>
          {renderTextarea('💪 Điểm mạnh', 'strengths', 'Đối tác đã làm tốt điều gì?')}
          {renderTextarea('⚠️ Điểm cần cải thiện', 'weaknesses', 'Điều gì cần khắc phục?')}
          {renderTextarea('🎯 Lời khuyên', 'suggestions', 'Lời khuyên cho lần sau?')}
        </>
      )}

      {/* Comment cho Candidate → Mentor */}
      {mode === 'CANDIDATE_TO_MENTOR' &&
        renderTextarea('💬 Nhận xét chi tiết', 'comment', 'Chia sẻ thêm về buổi học...')}

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Để sau
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </div>
  );
};
