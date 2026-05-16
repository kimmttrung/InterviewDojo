// src/features/mentor/profile-management/mappers/mentorProfileSubmit.mapper.ts

import type {
  SaveMentorProfilePayload,
  ExperiencePayload,
  SkillPayload,
  CoachingPlanPayload,
  CoachingQuestionPayload,
} from '../types/mentorProfile.payload';

import type { MentorProfileFormState } from '../types/mentorProfile.form';

export function mapStoreToPayload(state: MentorProfileFormState): SaveMentorProfilePayload {
  return {
    // =========================
    // PROFILE
    // =========================

    name: state.profile.name.trim(),

    bio: state.profile.bio.trim(),

    headline: state.profile.headline.trim(),

    avatarUrl: state.profile.avatarUrl?.trim() || '',

    linkedInLink: state.profile.linkedInLink?.trim()
      ? state.profile.linkedInLink.trim()
      : undefined,

    githubLink: state.profile.githubLink?.trim() ? state.profile.githubLink.trim() : undefined,

    introductionVideoUrl: state.profile.introductionVideoUrl?.trim()
      ? state.profile.introductionVideoUrl.trim()
      : undefined,

    // =========================
    // EXPERIENCES
    // =========================

    experiences: state.experiences.map(
      (experience): ExperiencePayload => ({
        id: experience.id,

        companyId: experience.companyId,

        jobRoleId: experience.jobRoleId,

        startDate: experience.startDate,

        endDate: experience.endDate?.trim() ? experience.endDate : undefined,

        isCurrent: experience.isCurrent,

        description: experience.description?.trim() ? experience.description.trim() : undefined,

        proofUrl: experience.proofUrl?.trim() ? experience.proofUrl.trim() : undefined,
      }),
    ),

    // =========================
    // SKILLS
    // =========================

    skills: state.skills.map(
      (skill): SkillPayload => ({
        id: skill.id,

        skillId: skill.skillId,

        experienceMonths: skill.experienceMonths,

        level: skill.level,

        proofUrl: skill.proofUrl?.trim() ? skill.proofUrl.trim() : undefined,
      }),
    ),

    // =========================
    // COACHING PLANS
    // =========================

    coachingPlans: state.coachingPlans.map(
      (plan): CoachingPlanPayload => ({
        id: plan.id,

        title: plan.title.trim(),

        description: plan.description?.trim() ? plan.description.trim() : undefined,

        duration: plan.duration,

        price: plan.price,

        categoryId: plan.categoryId,

        questions:
          plan.questions?.map(
            (question): CoachingQuestionPayload => ({
              id: question.id,

              question: question.question.trim(),

              type: question.type,

              isRequired: question.isRequired,
            }),
          ) ?? [],
      }),
    ),
  };
}
