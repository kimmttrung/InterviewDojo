// features/candidate/mentor-booking/components/BookingModal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { bookingService } from '../services/booking.service';
import { CoachingPlan, AvailableSession } from '../types';
import { CalendarSlotPicker } from './CalendarSlotPicker';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { formatICTTime } from '@/shared/utils/date';
import { Eye, FileText, Paperclip, Trash2 } from 'lucide-react';
type BookingStep = 'FORM' | 'CONFIRM';

interface BookingModalProps {
  mentorId: number;
  plan: CoachingPlan;
  onClose: () => void;
}

export function BookingModal({ mentorId, plan, onClose }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('FORM');
  const [session, setSession] = useState<AvailableSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileAnswers, setFileAnswers] = useState<Record<string, File>>({});
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const queryClient = useQueryClient();
  const { data: wallet } = useWallet();
  const balance = wallet?.creditBalance ?? 0;
  const remaining = balance - plan.price;
  const insufficient = remaining < 0;

  const createBookingMutation = useMutation({ mutationFn: bookingService.createBooking });
  const payBookingMutation = useMutation({ mutationFn: bookingService.payBooking });
  const isProcessing = createBookingMutation.isPending || payBookingMutation.isPending;

  const validateQuestions = () => {
    for (const q of plan.questions) {
      if (!q.isRequired) continue;
      if (q.type === 'TEXT') {
        const answer = answers[String(q.id)];
        if (!answer || answer.trim() === '') {
          toast.error(`Vui lòng trả lời câu hỏi: ${q.question}`);
          return false;
        }
      } else if (q.type === 'FILE') {
        const file = fileAnswers[String(q.id)];
        if (!file) {
          toast.error(`Vui lòng tải lên file cho câu hỏi: ${q.question}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!session) {
      toast.error('Vui lòng chọn khung giờ');
      return;
    }
    if (!validateQuestions()) return;
    setStep('CONFIRM');
  };

  const handleConfirmPayment = async () => {
    if (!session) return;
    try {
      setIsUploadingFiles(true);
      const uploadedFileUrls: Record<string, string> = {};

      // 1. Duyệt loop upload file qua service mới tạo
      const uploadPromises = Object.entries(fileAnswers).map(async ([questionId, file]) => {
        const formData = new FormData();
        formData.append('file', file);

        // Gọi qua service sạch sẽ của dự án
        const response = await bookingService.uploadAttachment(formData);
        uploadedFileUrls[questionId] = response.secure_url;
      });

      if (uploadPromises.length > 0) {
        toast.loading('Đang tải tài liệu lên hệ thống...', { id: 'upload-attachments' });
        await Promise.all(uploadPromises);
        toast.dismiss('upload-attachments');
      }

      // 2. Chuẩn bị payload JSON câu trả lời
      const formattedAnswers = plan.questions.map((q) => ({
        questionId: q.id,
        answerText: answers[String(q.id)] || '',
        fileUrl: uploadedFileUrls[String(q.id)] || '', // Đính kèm link Cloudinary sạch từ service trả về
      }));

      // 3. Gọi mutation tạo đơn đặt lịch
      const booking = await createBookingMutation.mutateAsync({
        coachingPlanId: plan.id,
        startTime: session.startTime,
        endTime: session.endTime,
        answers: formattedAnswers,
      });
      await payBookingMutation.mutateAsync(booking.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['available-days'] }),
        queryClient.invalidateQueries({ queryKey: ['available-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
      ]);
      toast.success('Đặt lịch thành công');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDateSelect = () => {
    setSession(null);
  };

  const handleFileChange = (questionId: number, file: File | null) => {
    if (file) {
      setFileAnswers((prev) => ({ ...prev, [String(questionId)]: file }));
    } else {
      setFileAnswers((prev) => {
        const newState = { ...prev };
        delete newState[String(questionId)];
        return newState;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {step === 'CONFIRM' ? 'Xác nhận thanh toán' : `Đặt lịch: ${plan.title}`}
          </h2>
          <button
            disabled={isProcessing}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {step === 'FORM' ? (
          <>
            <CalendarSlotPicker
              mentorId={mentorId}
              planId={plan.id}
              onSelectSession={setSession}
              onDateSelect={handleDateSelect}
            />
            {plan.questions.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Thông tin bổ sung</h3>
                {plan.questions.map((q) => (
                  <div key={q.id}>
                    <label className="mb-1 block text-sm font-medium">
                      {q.question}
                      {q.isRequired && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {q.type === 'TEXT' ? (
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border p-2 text-sm"
                        value={answers[String(q.id)] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [String(q.id)]: e.target.value }))
                        }
                      />
                    ) : (
                      <div className="space-y-2">
                        {/* Nút upload custom nhìn chuyên nghiệp hơn input gốc */}
                        {!fileAnswers[String(q.id)] ? (
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Paperclip className="w-6 h-6 text-gray-400 mb-1" />
                              <p className="text-sm text-gray-500 font-medium">
                                Tải lên tài liệu (PDF, Word, Ảnh...)
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                            />
                          </label>
                        ) : (
                          /* Khối hiển thị file đã chọn kèm Preview */
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 border-indigo-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {fileAnswers[String(q.id)].type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(fileAnswers[String(q.id)])}
                                  alt="Preview"
                                  className="w-10 h-10 rounded object-cover border"
                                />
                              ) : (
                                <div className="p-2 bg-indigo-50 rounded text-indigo-600">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate text-gray-700">
                                  {fileAnswers[String(q.id)].name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {(fileAnswers[String(q.id)].size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Nút xem thử file nếu định dạng hỗ trợ */}
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    URL.createObjectURL(fileAnswers[String(q.id)]),
                                    '_blank',
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-white transition"
                                title="Xem trước"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Nút gỡ file */}
                              <button
                                type="button"
                                onClick={() => handleFileChange(q.id, null)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-white transition"
                                title="Xóa file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={!session}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Tiếp tục
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Dịch vụ</span>
              <span className="font-medium">{plan.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thời gian</span>
              <span className="font-medium">
                {session &&
                  `${formatICTTime(session.startTime)} - ${formatICTTime(session.endTime)}`}
              </span>
            </div>
            <hr />
            <div className="flex justify-between">
              <span className="text-gray-600">Giá</span>
              <span className="font-semibold">{plan.price} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số dư hiện tại</span>
              <span>{balance} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Còn lại sau thanh toán</span>
              <span className={insufficient ? 'text-red-500' : 'text-green-600'}>
                {remaining} credits
              </span>
            </div>
            {insufficient && (
              <div className="text-sm text-red-500">Số dư không đủ để thanh toán</div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" disabled={isProcessing} onClick={() => setStep('FORM')}>
                Quay lại
              </Button>
              {insufficient ? (
                <Button variant="outline">Nạp thêm credits</Button>
              ) : (
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
