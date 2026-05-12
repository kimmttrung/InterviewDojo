import { useState } from 'react';
import type { AvailableSlot, CoachingPlan } from '../types/mentor.types';
import { useCreateBooking } from '../hooks/useMentorDetail';

export default function BookingModal({
  mentorId,
  plan,
  slots,
  onClose,
}: {
  mentorId: number;
  plan: CoachingPlan;
  slots: AvailableSlot[];
  onClose: () => void;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const createBookingMutation = useCreateBooking(mentorId);

  const handleSubmit = async () => {
    if (!selectedSlotId) {
      alert('Vui lòng chọn lịch rảnh');
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        slotId: selectedSlotId,
        coachingPlanId: plan.id,
        answers: plan.questions.map((question) => ({
          questionId: question.id,
          answerText: answers[question.id] ?? '',
        })),
      });

      alert('Đặt lịch thành công, đang chờ mentor duyệt');
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? 'Đặt lịch thất bại, vui lòng thử lại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-xl font-semibold">Đặt lịch: {plan.title}</h2>

        <div className="mt-5">
          <h3 className="mb-3 font-medium">Chọn lịch rảnh</h3>

          {slots.length === 0 ? (
            <p className="text-sm text-gray-500">Mentor hiện chưa có lịch rảnh.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`rounded-xl border p-3 text-left text-sm ${
                    selectedSlotId === slot.id ? 'border-black bg-gray-100' : ''
                  }`}
                >
                  {new Date(slot.startTime).toLocaleString('vi-VN')} -{' '}
                  {new Date(slot.endTime).toLocaleTimeString('vi-VN')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <h3 className="font-medium">Thông tin gửi mentor</h3>

          {plan.questions?.map((question) => (
            <div key={question.id}>
              <label className="text-sm font-medium">
                {question.question}
                {question.isRequired && <span className="text-red-500"> *</span>}
              </label>

              <textarea
                className="mt-2 w-full rounded-xl border p-3"
                placeholder={question.placeholder ?? ''}
                value={answers[question.id] ?? ''}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            disabled={createBookingMutation.isPending}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {createBookingMutation.isPending ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
          </button>
        </div>
      </div>
    </div>
  );
}
