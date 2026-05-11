import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMentorAvailableSlots, useMentorDetail } from '../hooks/useMentorDetail';
import type { CoachingPlan } from '../types/mentor.types';
import MentorSkillSection from '../components/MentorSkillSection';
import MentorExperienceSection from '../components/MentorExperienceSection';
import BookingModal from '../components/BookingModal';

export default function MentorDetailPage() {
  const { id } = useParams();
  const mentorId = Number(id);

  const [selectedPlan, setSelectedPlan] = useState<CoachingPlan | null>(null);

  const { data: mentor, isLoading, isError } = useMentorDetail(mentorId);
  const { data: slots = [] } = useMentorAvailableSlots(mentorId);

  if (isLoading) {
    return <div className="p-8">Đang tải thông tin mentor...</div>;
  }

  if (isError || !mentor) {
    return <div className="p-8 text-red-500">Không tải được mentor.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <img
            src={mentor.avatarUrl || '/default-avatar.png'}
            alt={mentor.name}
            className="h-24 w-24 rounded-full object-cover"
          />

          <div>
            <h1 className="text-3xl font-bold">{mentor.name}</h1>
            <p className="mt-1 text-gray-600">{mentor.mentorProfile?.headline}</p>
            <p className="mt-3 text-gray-700">{mentor.bio || 'Mentor chưa cập nhật bio.'}</p>
          </div>
        </div>
      </section>

      {mentor.mentorProfile?.introductionVideoUrl && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Video giới thiệu</h2>
          <video
            src={mentor.mentorProfile.introductionVideoUrl}
            controls
            className="w-full rounded-xl"
          />
        </section>
      )}

      <MentorSkillSection skills={mentor.skills ?? []} />

      <MentorExperienceSection experiences={mentor.experiences ?? []} />

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Dịch vụ cung cấp</h2>

        {mentor.coachingPlans?.length === 0 ? (
          <p className="text-sm text-gray-500">Mentor chưa có dịch vụ.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mentor.coachingPlans?.map((plan) => (
              <div key={plan.id} className="rounded-xl border p-5">
                <h3 className="text-lg font-semibold">{plan.title}</h3>

                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

                <div className="mt-4 flex justify-between">
                  <span className="font-semibold">{plan.price.toLocaleString('vi-VN')} credit</span>

                  <span className="text-sm text-gray-500">{plan.duration} phút</span>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-white"
                >
                  Đặt dịch vụ
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedPlan && (
        <BookingModal
          mentorId={mentorId}
          plan={selectedPlan}
          slots={slots}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
