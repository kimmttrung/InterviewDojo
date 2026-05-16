import { useEffect, useRef } from 'react';

import { Loader2 } from 'lucide-react';

import { MentorLayout } from '@/features/mentor/dashboard/components/MentorLayout';

import { Button } from '@/shared/components/ui/button';

import { useMentorProfileStore } from '@/stores/mentorProfile.store';

import { MentorProfileForm } from '../components/MentorProfileForm';

import { ExperienceTable } from '../components/ExperienceForm';

import { SkillTable } from '../components/SkillTable';

import { CoachingPlanTable } from '../components/CoachingPlanForm';

import { StatusBadge } from '../components/StatusBadge';

import { useMentorProfile } from '../hooks/useMentorProfile';

import { useUpdateMentorProfile } from '../hooks/useUpdateMentorProfile';

import { mapMentorProfileToStore } from '../mappers/mentorProfile.mapper';

import { mapStoreToPayload } from '../mappers/mentorProfileSubmit.mapper';

export default function MentorProfileManagement() {
  const { profile, experiences, skills, coachingPlans, setAllData } = useMentorProfileStore();

  const { data, isLoading, isFetching, refetch } = useMentorProfile();

  const updateProfileMutation = useUpdateMentorProfile();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!data || initializedRef.current) {
      return;
    }

    setAllData(mapMentorProfileToStore(data));

    initializedRef.current = true;
  }, [data, setAllData]);

  const handleSubmitAll = () => {
    const payload = mapStoreToPayload({
      profile,
      experiences,
      skills,
      coachingPlans,
    });

    updateProfileMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <MentorLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* =====================================================
           * Header
           * =================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Mentor Profile Management
                  </h1>

                  {data?.approvalStatus && <StatusBadge status={data.approvalStatus} />}

                  {isFetching && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Update your professional details, experiences, skills, and coaching services.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>

                <Button
                  size="lg"
                  onClick={handleSubmitAll}
                  disabled={updateProfileMutation.isPending}
                  className="min-w-[220px]"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Profile...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* =====================================================
           * Main Content
           * =================================================== */}

          <div className="space-y-8">
            <section>
              <MentorProfileForm />
            </section>

            <section>
              <ExperienceTable />
            </section>

            <section>
              <SkillTable />
            </section>

            <section>
              <CoachingPlanTable />
            </section>
          </div>
        </div>
      </div>
    </MentorLayout>
  );
}
