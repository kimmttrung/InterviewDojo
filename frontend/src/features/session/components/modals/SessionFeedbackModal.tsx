import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { FeedbackForm } from '@/features/shared-domain/feedback/components/FeedbackForm';
import {
  usePartnerFeedback,
  useMyFeedback,
} from '@/features/shared-domain/feedback/hooks/useFeedback';
import { useCurrentUser } from '@/features/auth';
import { Loader2, Star, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  sessionType: 'MENTOR' | 'P2P' | 'SOLO';
}

export const SessionFeedbackModal = ({ open, onClose, sessionId, sessionType }: Props) => {
  const { data: currentUser } = useCurrentUser();
  const {
    data: partnerFeedback,
    isLoading: partnerLoading,
    error: partnerError,
  } = usePartnerFeedback(sessionId);
  const { data: myFeedback, isLoading: myLoading } = useMyFeedback(sessionId);

  // 1. SỬA LỖI: Thêm type 'SOLO' và xoá `return null`
  let feedbackMode: 'CANDIDATE_TO_MENTOR' | 'MENTOR_TO_CANDIDATE' | 'P2P' | 'SOLO' = 'P2P';
  if (sessionType === 'MENTOR') {
    feedbackMode = currentUser?.role === 'MENTOR' ? 'MENTOR_TO_CANDIDATE' : 'CANDIDATE_TO_MENTOR';
  } else if (sessionType === 'P2P') {
    feedbackMode = 'P2P';
  } else if (sessionType === 'SOLO') {
    feedbackMode = 'SOLO';
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Session Feedback</DialogTitle>
        </DialogHeader>

        {/* 2. SỬA LỖI: Đặt mặc định tab tuỳ theo loại session */}
        <Tabs
          defaultValue={sessionType === 'SOLO' ? 'received' : 'send'}
          className="flex-1 flex flex-col"
        >
          <TabsList
            className={`grid w-full ${sessionType === 'SOLO' ? 'grid-cols-1' : 'grid-cols-3'}`}
          >
            {sessionType !== 'SOLO' && <TabsTrigger value="send">Gửi đánh giá</TabsTrigger>}
            {sessionType !== 'SOLO' && <TabsTrigger value="sent">Đã gửi</TabsTrigger>}
            <TabsTrigger value="received">Nhận được</TabsTrigger>
          </TabsList>

          {/* 3. Chỉ hiển thị form gửi nếu không phải SOLO */}
          {sessionType !== 'SOLO' && (
            <>
              <TabsContent value="send" className="flex-1 overflow-y-auto mt-4">
                <FeedbackForm
                  mode={feedbackMode as any}
                  sessionId={sessionId}
                  onSuccess={onClose}
                  onCancel={onClose}
                />
              </TabsContent>
              <TabsContent value="sent" className="flex-1 overflow-y-auto mt-4">
                {myLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : !myFeedback ? (
                  <div className="text-center py-12 text-gray-500">
                    Bạn chưa gửi đánh giá cho phiên học này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border p-5">
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            Bạn
                          </div>
                          <div>
                            <h4 className="font-semibold">Bạn</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar size={12} />
                              <span>
                                {format(new Date(myFeedback.createdAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{myFeedback.overallScore}</span>
                        </div>
                      </div>
                      {myFeedback.quickTags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                          {myFeedback.quickTags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
                            >
                              <Sparkles size={10} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {myFeedback.comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg italic text-gray-600 text-sm">
                          “{myFeedback.comment}”
                        </div>
                      )}
                      {(myFeedback.strengths ||
                        myFeedback.weaknesses ||
                        myFeedback.suggestions) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {myFeedback.strengths && (
                            <div className="bg-green-50 p-2 rounded-lg">
                              <p className="font-semibold text-green-700">💪 Điểm mạnh</p>
                              <p className="text-gray-700">{myFeedback.strengths}</p>
                            </div>
                          )}
                          {myFeedback.weaknesses && (
                            <div className="bg-amber-50 p-2 rounded-lg">
                              <p className="font-semibold text-amber-700">⚠️ Cần cải thiện</p>
                              <p className="text-gray-700">{myFeedback.weaknesses}</p>
                            </div>
                          )}
                          {myFeedback.suggestions && (
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <p className="font-semibold text-blue-700">🎯 Lời khuyên</p>
                              <p className="text-gray-700">{myFeedback.suggestions}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </>
          )}

          <TabsContent value="received" className="flex-1 overflow-y-auto mt-4">
            {partnerLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}

            {partnerError && (
              <div className="text-center text-red-500 py-8">Failed to load feedback</div>
            )}

            {!partnerLoading && !partnerError && !partnerFeedback && (
              <div className="text-center py-12 text-gray-500">
                {sessionType === 'SOLO'
                  ? 'Hệ thống AI chưa phân tích xong đánh giá của bạn.'
                  : 'Đối tác chưa gửi đánh giá cho bạn.'}
              </div>
            )}

            {partnerFeedback && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {/* 4. Đổi Avatar chữ cho AI */}
                        {sessionType === 'SOLO'
                          ? 'AI'
                          : partnerFeedback.reviewerName?.charAt(0).toUpperCase() || 'U'}
                      </div>

                      <div>
                        <h4 className="font-semibold">
                          {sessionType === 'SOLO' ? 'AI Reviewer' : partnerFeedback.reviewerName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar size={12} />
                          <span>
                            {format(new Date(partnerFeedback.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{partnerFeedback.overallScore}</span>
                    </div>
                  </div>

                  {partnerFeedback.quickTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                      {partnerFeedback.quickTags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
                        >
                          <Sparkles size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {partnerFeedback.comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg italic text-gray-600 text-sm">
                      “{partnerFeedback.comment}”
                    </div>
                  )}

                  {(partnerFeedback.strengths ||
                    partnerFeedback.weaknesses ||
                    partnerFeedback.suggestions) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {partnerFeedback.strengths && (
                        <div className="bg-green-50 p-2 rounded-lg">
                          <p className="font-semibold text-green-700">💪 Strengths</p>
                          <p className="text-gray-700">{partnerFeedback.strengths}</p>
                        </div>
                      )}

                      {partnerFeedback.weaknesses && (
                        <div className="bg-amber-50 p-2 rounded-lg">
                          <p className="font-semibold text-amber-700">⚠️ Areas for improvement</p>
                          <p className="text-gray-700">{partnerFeedback.weaknesses}</p>
                        </div>
                      )}

                      {partnerFeedback.suggestions && (
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <p className="font-semibold text-blue-700">🎯 Suggestions</p>
                          <p className="text-gray-700">{partnerFeedback.suggestions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
