// types/mentorProfile.form.ts
import type {
  SkillLevel,
  SkillType,
  CoachingQuestionType,
} from '@/features/mentor/profile-management/types/mentor.types';

export interface ExperienceFormItem {
  id?: number;

  companyId: number;

  companyName?: string;

  companyLogoUrl?: string;

  jobRoleId: number;

  roleName?: string;

  startDate: string;

  endDate?: string;

  isCurrent: boolean;

  description?: string;

  proofUrl?: string;
}

export interface SkillFormItem {
  id?: number;

  skillId: number;

  skill?: string;

  type: SkillType;

  experienceMonths: number;

  level: SkillLevel;

  proofUrl?: string;
}

export interface CoachingQuestionFormItem {
  id?: number;

  question: string;

  type: CoachingQuestionType;

  isRequired?: boolean;
}

export interface CoachingPlanFormItem {
  id?: number;

  title: string;

  description: string;

  duration: number;

  price: number;

  isActive?: boolean;

  categoryId: number;

  category?: {
    id: number;
    name: string;
  } | null;

  questions?: CoachingQuestionFormItem[];
}

export interface MentorProfileFormValues {
  name: string;

  bio: string;

  avatarUrl: string;

  linkedInLink: string;

  githubLink: string;

  headline: string;

  introductionVideoUrl: string;
}

export interface MentorProfileFormState {
  profile: MentorProfileFormValues;

  experiences: ExperienceFormItem[];

  skills: SkillFormItem[];

  coachingPlans: CoachingPlanFormItem[];
}
