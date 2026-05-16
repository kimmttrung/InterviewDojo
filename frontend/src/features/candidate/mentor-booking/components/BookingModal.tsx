import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { CoachingPlan, AvailableSession } from '../types';
import { Button } from '@/shared/components/ui/button';
import { CalendarSlotPicker } from './CalendarSlotPicker';

interface BookingModalProps {
  mentorId: number;
  plan: CoachingPlan;
  onClose: () => void;
}

export function BookingModal({ mentorId, plan, onClose }: BookingModalProps) {
  const [session, setSession] = useState<AvailableSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: () =>
      bookingService.createBooking({
        coachingPlanId: plan.id,
        startTime: session!.startTime,
        endTime: session!.endTime,
        answers: plan.questions.map((q) => ({
          questionId: q.id,
          answerText: answers[q.id] || '',
        })),
      }),
  });

  const payBookingMutation = useMutation({
    mutationFn: (bookingId: number) => bookingService.payBooking(bookingId),
  });

  const handleBook = async () => {
    if (!session) {
      alert('Vui lòng chọn khung giờ');
      return;
    }

    try {
      const booking = await createBookingMutation.mutateAsync();
      await payBookingMutation.mutateAsync(booking.id);
      queryClient.invalidateQueries({ queryKey: ['available-days'] });
      queryClient.invalidateQueries({ queryKey: ['available-sessions'] });
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Đặt lịch: {plan.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <CalendarSlotPicker mentorId={mentorId} planId={plan.id} onSelectSession={setSession} />

        {plan.questions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium">Thông tin bổ sung</h3>
            {plan.questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium mb-1">
                  {q.question}
                  {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {q.type === 'TEXT' ? (
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder={q.placeholder || ''}
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                ) : (
                  <input
                    type="file"
                    className="w-full text-sm"
                    onChange={(e) => {
                      // handle file upload nếu cần
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleBook}
            disabled={!session || createBookingMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {createBookingMutation.isPending ? 'Đang xử lý...' : 'Đặt lịch & Thanh toán'}
          </Button>
        </div>
      </div>
    </div>
  );
}
