import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Rating } from 'react-simple-star-rating';
import { useMyReceivedFeedbacks } from '../hooks/useFeedback';
import { Loader2, Calendar, Star, MessageSquare, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ReceivedFeedbackModal = ({ open, onClose }: Props) => {
  const { data: feedbacks, isLoading } = useMyReceivedFeedbacks();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl border-0">
        {/* Header with gradient */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-t-2xl p-6 text-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              Feedback từ đối tác
              <Sparkles className="h-6 w-6 text-yellow-300" />
            </DialogTitle>
            <p className="text-indigo-100 text-sm mt-1">
              Những đánh giá mà bạn đã nhận được từ các buổi phỏng vấn cùng đối tác
            </p>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping"></div>
                <Loader2 className="relative h-10 w-10 animate-spin text-indigo-600" />
              </div>
            </div>
          ) : feedbacks?.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Chưa có đánh giá nào</h3>
              <p className="text-sm text-gray-500 mt-1">
                Hãy tham gia các buổi phỏng vấn để nhận feedback từ đối tác.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {feedbacks?.map((fb, idx) => (
                <div
                  key={fb.id}
                  className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  {/* Decorative gradient bar on the left */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl"></div>

                  <div className="p-5 pl-6">
                    {/* Header: reviewer info + rating */}
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                          {fb.reviewerName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{fb.reviewerName}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <Calendar size={12} />
                            <span>{format(new Date(fb.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-amber-700">
                          {fb.overallScore}
                        </span>
                      </div>
                    </div>

                    {/* Quick tags (if any) */}
                    {fb.quickTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                        {fb.quickTags.map((tag) => (
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

                    {/* Comment (if any) */}
                    {fb.comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg italic text-gray-600 text-sm border-l-3 border-indigo-200">
                        “{fb.comment}”
                      </div>
                    )}

                    {/* Strengths, Weaknesses, Suggestions (P2P style) */}
                    {(fb.strengths || fb.weaknesses || fb.suggestions) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {fb.strengths && (
                          <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                            <p className="font-semibold text-green-700 flex items-center gap-1">
                              <span>💪</span> Điểm mạnh
                            </p>
                            <p className="text-gray-700 mt-1">{fb.strengths}</p>
                          </div>
                        )}
                        {fb.weaknesses && (
                          <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                            <p className="font-semibold text-amber-700 flex items-center gap-1">
                              <span>⚠️</span> Cần cải thiện
                            </p>
                            <p className="text-gray-700 mt-1">{fb.weaknesses}</p>
                          </div>
                        )}
                        {fb.suggestions && (
                          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                            <p className="font-semibold text-blue-700 flex items-center gap-1">
                              <span>🎯</span> Lời khuyên
                            </p>
                            <p className="text-gray-700 mt-1">{fb.suggestions}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If no strengths/weaknesses, but overallScore exists, just show rating */}
                    {!fb.strengths && !fb.weaknesses && !fb.suggestions && fb.comment && (
                      <div className="mt-2 flex justify-end">
                        <Rating initialValue={fb.overallScore} readonly size={16} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtle gradient */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 p-3 text-center text-xs text-gray-400 rounded-b-2xl">
          Chỉ hiển thị những đánh giá đã được gửi
        </div>
      </DialogContent>
    </Dialog>
  );
};
