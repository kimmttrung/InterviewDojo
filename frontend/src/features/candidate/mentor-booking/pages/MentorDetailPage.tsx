// pages/MentorDetailPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMentorDetail } from '../hooks/useMentorDetail';
import { useMentorPlans } from '../hooks/useMentorPlans';
import { MentorProfileSection } from '../components/MentorProfileSection';
import { MentorSkillsSection } from '../components/MentorSkillsSection';
import { MentorExperiencesSection } from '../components/MentorExperiencesSection';
import { PlanSelector } from '../components/PlanSelector';
import { BookingModal } from '../components/BookingModal';
import { Layout } from '@/shared/components/layout/Layout';
import { Loader2 } from 'lucide-react';
import type { CoachingPlan } from '../types/mentor-detail.types';

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mentorId = Number(id);
  const { data: mentor, isLoading, isError } = useMentorDetail(mentorId);
  const { data: plans = [] } = useMentorPlans(mentorId);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (isError || !mentor) {
    return (
      <Layout>
        <div className="flex h-[70vh] items-center justify-center text-slate-500">
          Mentor not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <MentorProfileSection mentor={mentor} />
        <MentorSkillsSection skills={mentor.skills ?? []} />
        <MentorExperiencesSection
          experiences={mentor.mentorProfile?.experiences ?? mentor.experiences ?? []}
        />
        <PlanSelector plans={plans} selectedPlanId={selectedPlanId} onSelect={setSelectedPlanId} />
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
