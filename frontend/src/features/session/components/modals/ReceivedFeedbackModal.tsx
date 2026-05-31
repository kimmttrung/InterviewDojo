// shared-domain/feedback/components/ReceivedFeedbackModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { usePartnerFeedback } from '../../../shared-domain/feedback/hooks/useFeedback';
import { Loader2, Calendar, Star, MessageSquare, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: number | null;
}

export const ReceivedFeedbackModal = ({ open, onClose, sessionId }: Props) => {
  const {
    data: feedback,
    isLoading,
    error,
  } = usePartnerFeedback(sessionId ?? 0, {
    enabled: !!sessionId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl border-0">
        <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-100 rounded-t-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2 text-blue-900">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Feedback từ đối tác
            </DialogTitle>
            <p className="text-blue-700/70 text-sm mt-1">
              Đánh giá dành cho bạn trong phiên học này
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">
              Không thể tải feedback. Vui lòng thử lại sau.
            </div>
          ) : !feedback ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Chưa có đánh giá</h3>
              <p className="text-sm text-gray-500 mt-1">
                Đối tác chưa gửi feedback cho phiên học này.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="group relative bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl"></div>

                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                      {feedback.reviewerName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{feedback.reviewerName}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Calendar size={12} />
                        <span>{format(new Date(feedback.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-amber-700">
                      {feedback.overallScore}
                    </span>
                  </div>
                </div>

                {feedback.quickTags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                    {feedback.quickTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100"
                      >
                        <Sparkles size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {feedback.comment && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg italic text-gray-600 text-sm">
                    “{feedback.comment}”
                  </div>
                )}

                {(feedback.strengths || feedback.weaknesses || feedback.suggestions) && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {feedback.strengths && (
                      <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                        <p className="font-semibold text-green-700 flex items-center gap-1">
                          💪 Điểm mạnh
                        </p>
                        <p className="text-gray-700 mt-1">{feedback.strengths}</p>
                      </div>
                    )}
                    {feedback.weaknesses && (
                      <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                        <p className="font-semibold text-amber-700 flex items-center gap-1">
                          ⚠️ Cần cải thiện
                        </p>
                        <p className="text-gray-700 mt-1">{feedback.weaknesses}</p>
                      </div>
                    )}
                    {feedback.suggestions && (
                      <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                        <p className="font-semibold text-blue-700 flex items-center gap-1">
                          🎯 Lời khuyên
                        </p>
                        <p className="text-gray-700 mt-1">{feedback.suggestions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 p-3 text-center text-xs text-gray-400 rounded-b-2xl">
          Feedback được gửi sau buổi phỏng vấn
        </div>
      </DialogContent>
    </Dialog>
  );
};
