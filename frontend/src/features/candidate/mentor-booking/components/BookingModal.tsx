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
          toast.error(`Please answer the question: ${q.question}`);
          return false;
        }
      } else if (q.type === 'FILE') {
        const file = fileAnswers[String(q.id)];
        if (!file) {
          toast.error(`Please upload a file for the question: ${q.question}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!session) {
      toast.error('Please select a time slot');
      return;
    }
    if (!validateQuestions()) return;
    setStep('CONFIRM');
  };

  const handleConfirmPayment = async () => {
    if (!session) return;
    try {
      // TODO: upload files trước khi tạo booking (nếu cần)
      const booking = await createBookingMutation.mutateAsync({
        coachingPlanId: plan.id,
        startTime: session.startTime,
        endTime: session.endTime,
        answers: plan.questions.map((q) => ({
          questionId: q.id,
          answerText: answers[String(q.id)] || '',
        })),
      });
      await payBookingMutation.mutateAsync(booking.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['available-days'] }),
        queryClient.invalidateQueries({ queryKey: ['available-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
      ]);
      toast.success('Booking successful');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'An error occurred');
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
            {step === 'CONFIRM' ? 'Confirm Payment' : `Book Appointment: ${plan.title}`}
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
                <h3 className="font-medium">Additional Information</h3>
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
                      <input
                        type="file"
                        className="w-full text-sm"
                        onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                      />
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
                Continue
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Service</span>
              <span className="font-medium">{plan.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span className="font-medium">
                {session &&
                  `${formatICTTime(session.startTime)} - ${formatICTTime(session.endTime)}`}
              </span>
            </div>
            <hr />
            <div className="flex justify-between">
              <span className="text-gray-600">Price</span>
              <span className="font-semibold">{plan.price} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Balance</span>
              <span>{balance} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining Balance</span>
              <span className={insufficient ? 'text-red-500' : 'text-green-600'}>
                {remaining} credits
              </span>
            </div>
            {insufficient && (
              <div className="text-sm text-red-500">Insufficient balance to complete payment</div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" disabled={isProcessing} onClick={() => setStep('FORM')}>
                Back
              </Button>
              {insufficient ? (
                <Button variant="outline">Top up credits</Button>
              ) : (
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
