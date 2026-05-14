// src/features/mentor/profile-management/pages/MentorProfileManagement.tsx

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { MentorLayout } from '@/features/mentor/dashboard/components/MentorLayout';
import { Button } from '@/shared/components/ui/button';
import { useMentorProfileStore } from '@/stores/mentorProfile.store';

import { MentorProfileForm } from '../components/MentorProfileForm';
import { ExperienceTable } from '../components/ExperienceForm';
import { SkillTable } from '../components/SkillTable';
import { CoachingPlanTable } from '../components/CoachingPlanForm';

import { useUpdateMentorProfile } from '../hooks/useUpdateMentorProfile';
import { useMentorProfile } from '../hooks/useMentorProfile';

// Hàm helper sinh màu cho trạng thái duyệt
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          ACTIVE
        </span>
      );
    case 'PENDING':
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          PENDING REVIEW
        </span>
      );
    case 'REJECTED':
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          REJECTED
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          SUSPENDED
        </span>
      );
    case 'INCOMPLETE':
    default:
      return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          INCOMPLETE
        </span>
      );
  }
};

export default function MentorProfileManagement() {
  const { profile, experiences, skills, coachingPlans, setAllData } = useMentorProfileStore();

  const updateProfileMutation = useUpdateMentorProfile();
  const { data: mentorProfile, isLoading, isFetching, refetch } = useMentorProfile();

  /**
   * Sync backend data -> Zustand store
   */
  useEffect(() => {
    if (!mentorProfile) {
      return;
    }

    setAllData({
      profile: {
        name: mentorProfile.name ?? '',
        bio: mentorProfile.bio ?? '',
        headline: mentorProfile.headline ?? '',
        avatarUrl: mentorProfile.avatarUrl ?? null,
        linkedInLink: mentorProfile.linkedInLink ?? null,
        githubLink: mentorProfile.githubLink ?? null,
        introductionVideoUrl: mentorProfile.introductionVideoUrl ?? null,
      },

      experiences:
        mentorProfile.experiences?.map((experience: any) => ({
          id: experience.id,
          companyId: experience.companyId || experience.company?.id || '',
          jobRoleId: experience.jobRoleId || experience.jobRole?.id || '',
          companyName: experience.company?.name ?? '',
          companyLogoUrl: experience.company?.logoUrl ?? '',
          roleName: experience.jobRole?.name ?? '',
          description: experience.description ?? '',
          startDate: experience.startDate ? experience.startDate.split('T')[0] : '',
          endDate: experience.endDate ? experience.endDate.split('T')[0] : '',
          isCurrent: experience.isCurrent ?? false,
          proofUrl: experience.proofUrl ?? '',
        })) ?? [],

      skills:
        mentorProfile.skills?.map((skill: any) => ({
          skillId: skill.skillId ?? 0,
          skill: skill.skill ?? '',
          type: skill.type ?? '',
          experienceMonths: skill.experienceMonths ?? 0,
          level: skill.level ?? '',
          proofUrl: skill.proofUrl ?? '',
        })) ?? [],

      coachingPlans:
        mentorProfile.coachingPlans?.map((plan: any) => ({
          id: plan.id,
          title: plan.title ?? '',
          description: plan.description ?? '',
          duration: plan.duration ?? 0,
          price: plan.price ?? 0,
          isActive: plan.isActive ?? true,
          // Chú ý: Phải có categoryId để select input nhận được giá trị
          categoryId: plan.category?.id ?? 0,
          category: plan.category ?? null,
          // Map mảng câu hỏi vào store
          questions:
            plan.questions?.map((q: any) => ({
              id: q.id,
              question: q.question,
              type: q.type,
              isRequired: q.isRequired ?? false,
            })) ?? [],
        })) ?? [],
    });
  }, [mentorProfile, setAllData]);

  const handleSubmitAll = async () => {
    updateProfileMutation.mutate(
      {
        ...profile,
        experiences,
        skills,
        coachingPlans,
      },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          console.error('Lỗi khi update profile:', error);
        },
      },
    );
  };

  /**
   * Initial loading screen
   */
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
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Mentor Profile Management
                  </h1>

                  {/* TRẠNG THÁI APPROVAL HIỂN THỊ TẠI ĐÂY */}
                  {mentorProfile?.approvalStatus && getStatusBadge(mentorProfile.approvalStatus)}

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

          {/* Main Content */}
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
