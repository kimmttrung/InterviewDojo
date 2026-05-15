// mappers/mentorProfile.mapper.ts

import type {
  MentorProfileResponse,
  ExperienceResponse,
  SkillResponse,
  CoachingPlanResponse,
} from '../types/mentorProfile.response';

import type {
  MentorProfileFormState,
  ExperienceFormItem,
  SkillFormItem,
  CoachingPlanFormItem,
} from '../types/mentorProfile.form';

import { formatDateForInput } from '../utils/date';

function mapExperience(exp: ExperienceResponse): ExperienceFormItem {
  return {
    id: exp.id,

    companyId: exp.companyId ?? exp.company?.id ?? 0,

    companyName: exp.company?.name ?? '',

    companyLogoUrl: exp.company?.logoUrl ?? '',

    jobRoleId: exp.jobRoleId ?? exp.jobRole?.id ?? 0,

    roleName: exp.jobRole?.name ?? '',

    description: exp.description ?? '',

    startDate: formatDateForInput(exp.startDate),

    endDate: formatDateForInput(exp.endDate),

    isCurrent: exp.isCurrent ?? false,

    proofUrl: exp.proofUrl ?? '',
  };
}

function mapSkill(skill: SkillResponse): SkillFormItem {
  return {
    id: skill.id,

    skillId: skill.skillId,

    skill: skill.skill ?? '',

    type: skill.type ?? 'HARDSKILL',

    experienceMonths: skill.experienceMonths ?? 0,

    level: skill.level ?? '',

    proofUrl: skill.proofUrl ?? '',
  };
}

function mapCoachingPlan(plan: CoachingPlanResponse): CoachingPlanFormItem {
  return {
    id: plan.id,

    title: plan.title ?? '',

    description: plan.description ?? '',

    duration: plan.duration ?? 0,

    price: plan.price ?? 0,

    isActive: plan.isActive ?? true,

    categoryId: plan.categoryId ?? plan.category?.id ?? 0,

    category: plan.category ?? null,

    questions:
      plan.questions?.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        isRequired: q.isRequired,
      })) ?? [],
  };
}

export function mapMentorProfileToStore(data: MentorProfileResponse): MentorProfileFormState {
  return {
    profile: {
      name: data.name ?? '',

      bio: data.bio ?? '',

      headline: data.headline ?? '',

      avatarUrl: data.avatarUrl ?? '',

      linkedInLink: data.linkedInLink ?? '',

      githubLink: data.githubLink ?? '',

      introductionVideoUrl: data.introductionVideoUrl ?? '',
    },

    experiences: data.experiences?.map(mapExperience) ?? [],

    skills: data.skills?.map(mapSkill) ?? [],

    coachingPlans: data.coachingPlans?.map(mapCoachingPlan) ?? [],
  };
}
