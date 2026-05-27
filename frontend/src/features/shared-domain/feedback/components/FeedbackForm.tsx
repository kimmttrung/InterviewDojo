// shared-domain/feedback/components/FeedbackForm.tsx
import { useState } from 'react';
import { StarRating } from 'react-awesome-stars';
import { QuickTagsSelector } from './QuickTagsSelector';
import { useSubmitFeedback } from '../hooks/useFeedback';
import { toast } from 'sonner';
import { FeedbackMode, FeedbackRequest } from '../types/feedback.types';
import { Rating } from 'react-simple-star-rating';
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
      toast.error('Please select a star rating');
      return;
    }

    if (mode === 'P2P' && !form.strengths && !form.weaknesses && !form.suggestions) {
      toast.error('Please enter at least one comment');
      return;
    }

    mutate(form, {
      onSuccess: () => {
        toast.success('Feedback submitted successfully!');
        onSuccess?.();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Submission failed');
      },
    });
  };

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
      <h2 className="text-xl font-bold text-gray-800 mb-4">Session Feedback</h2>

      {/* Rating */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-gray-700">Overall rating (1–10 stars):</span>

        <div className="flex flex-row items-center [font-size:0] [&_span]:inline-block [&_svg]:inline">
          <Rating
            initialValue={form.overallScore}
            onClick={handleRating}
            allowFraction={true}
            iconsCount={10}
            size={24}
            className="flex flex-row items-center gap-0.5"
          />
        </div>
      </div>

      {/* Quick tags */}
      {mode === 'CANDIDATE_TO_MENTOR' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select mentor strengths quickly
          </label>
          <QuickTagsSelector
            selected={form.quickTags || []}
            onChange={(tags) => setForm((prev) => ({ ...prev, quickTags: tags }))}
          />
        </div>
      )}

      {/* P2P & Mentor → Candidate */}
      {(mode === 'P2P' || mode === 'MENTOR_TO_CANDIDATE') && (
        <>
          {renderTextarea('Strengths', 'strengths', 'What did the partner do well?')}
          {renderTextarea('Areas for improvement', 'weaknesses', 'What should be improved?')}
          {renderTextarea('Suggestions', 'suggestions', 'Advice for next time?')}
        </>
      )}

      {renderTextarea('Additional comments', 'comment', 'Any other feedback or comments?')}

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Later
        </button>

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};
