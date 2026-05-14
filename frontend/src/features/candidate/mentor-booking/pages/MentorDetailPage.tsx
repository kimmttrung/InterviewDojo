import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMentorDetail } from '../hooks/useMentorDetail';
import { useMentorPlans } from '../hooks/useMentorPlans';
import { PlanSelector } from '../components/PlanSelector';
import { BookingModal } from '../components/BookingModal';
import { Layout } from '@/shared/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mentorId = Number(id);
  const { data: mentor, isLoading } = useMentorDetail(mentorId);
  const { data: plans = [] } = useMentorPlans(mentorId);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center p-12">Đang tải thông tin mentor...</div>
      </Layout>
    );
  }

  if (!mentor) {
    return (
      <Layout>
        <div className="text-center p-12 text-red-500">Không tìm thấy mentor.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Profile Section */}
        <section className="flex flex-col md:flex-row items-start gap-6 mb-10 bg-white rounded-2xl p-6 shadow-sm border">
          <Avatar className="h-24 w-24">
            <AvatarImage src={mentor.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">{mentor.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{mentor.name}</h1>
            <p className="text-lg text-gray-600">{mentor.mentorProfile?.headline}</p>
            {mentor.bio && <p className="mt-3 text-gray-700">{mentor.bio}</p>}
            <div className="mt-2 text-sm text-gray-500">
              {mentor.experienceYears > 0 && <span>{mentor.experienceYears} năm kinh nghiệm</span>}
            </div>
          </div>
        </section>

        {/* Skills & Experiences có thể thêm sau */}

        {/* Plans Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border">
          <PlanSelector
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelect={setSelectedPlanId}
          />
        </section>

        {/* Booking Modal */}
        {selectedPlan && (
          <BookingModal
            mentorId={mentorId}
            plan={selectedPlan}
            onClose={() => setSelectedPlanId(null)}
          />
        )}
      </div>
    </Layout>
  );
}
