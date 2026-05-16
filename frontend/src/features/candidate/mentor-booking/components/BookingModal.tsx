import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';

import { bookingService } from '../services/booking.service';

import { CoachingPlan, AvailableSession } from '../types';

import { CalendarSlotPicker } from './CalendarSlotPicker';

import { useWallet } from '@/features/wallet/hooks/useWallet';

interface BookingModalProps {
  mentorId: number;
  plan: CoachingPlan;
  onClose: () => void;
}

export function BookingModal({ mentorId, plan, onClose }: BookingModalProps) {
  const [session, setSession] = useState<AvailableSession | null>(null);

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [showConfirmation, setShowConfirmation] = useState(false);

  const queryClient = useQueryClient();

  const { data: wallet } = useWallet();

  const balance = wallet?.creditBalance ?? 0;

  const remaining = balance - plan.price;

  const insufficient = remaining < 0;

  const createBookingMutation = useMutation({
    mutationFn: bookingService.createBooking,
  });

  const payBookingMutation = useMutation({
    mutationFn: bookingService.payBooking,
  });

  const isProcessing = createBookingMutation.isPending || payBookingMutation.isPending;

  const validateQuestions = () => {
    const missingRequired = plan.questions.some((q) => q.isRequired && !answers[q.id]?.trim());

    if (missingRequired) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');

      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!session) {
      toast.error('Vui lòng chọn khung giờ');

      return;
    }

    if (!validateQuestions()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (!session) return;

    try {
      const booking = await createBookingMutation.mutateAsync({
        coachingPlanId: plan.id,

        startTime: session.startTime,

        endTime: session.endTime,

        answers: plan.questions.map((q) => ({
          questionId: q.id,
          answerText: answers[q.id] || '',
        })),
      });

      await payBookingMutation.mutateAsync(booking.id);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['available-days'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['available-sessions'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['wallet'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['bookings'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['current-user'],
        }),
      ]);

      toast.success('Đặt lịch thành công');

      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {showConfirmation ? 'Xác nhận thanh toán' : `Đặt lịch: ${plan.title}`}
          </h2>

          <button
            disabled={isProcessing}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {!showConfirmation ? (
          <>
            <CalendarSlotPicker mentorId={mentorId} planId={plan.id} onSelectSession={setSession} />

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
                        value={answers[q.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <input type="file" className="w-full text-sm" />
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
          <>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Dịch vụ</span>

                <span className="font-medium">{plan.title}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian</span>

                <span className="font-medium">
                  {session && `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
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
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isProcessing}
                onClick={() => setShowConfirmation(false)}
              >
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
          </>
        )}
      </div>
    </div>
  );
}
