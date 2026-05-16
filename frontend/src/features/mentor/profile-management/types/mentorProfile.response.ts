// types/mentorProfile.response.ts

import type {
  SkillLevel,
  SkillType,
  CoachingQuestionType,
} from '@/features/mentor/profile-management/types/mentor.types';

export type ApprovalStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'INCOMPLETE';

export interface ExperienceResponse {
  id: number;

  companyId?: number;

  company?: {
    id: number;
    name: string;
    logoUrl?: string | null;
  };

  jobRoleId?: number;

  jobRole?: {
    id: number;
    name: string;
  };

  description?: string | null;

  startDate: string;

  endDate?: string | null;

  isCurrent: boolean;

  proofUrl?: string | null;
}

export interface SkillResponse {
  id?: number;

  skillId: number;

  skill?: string;

  type?: SkillType;

  experienceMonths: number;

  level: SkillLevel;

  proofUrl?: string | null;
}

export interface CoachingPlanQuestionResponse {
  id: number;

  question: string;

  type: CoachingQuestionType;

  isRequired: boolean;
}

export interface CoachingPlanResponse {
  id: number;

  title: string;

  description?: string | null;

  duration: number;

  price: number;

  isActive: boolean;

  categoryId?: number;

  category?: {
    id: number;
    name: string;
    slug?: string;
  } | null;

  questions?: CoachingPlanQuestionResponse[];
}

export interface MentorProfileResponse {
  name?: string | null;

  bio?: string | null;

  headline?: string | null;

  avatarUrl?: string | null;

  linkedInLink?: string | null;

  githubLink?: string | null;

  introductionVideoUrl?: string | null;

  approvalStatus?: ApprovalStatus;

  experiences?: ExperienceResponse[];

  skills?: SkillResponse[];

  coachingPlans?: CoachingPlanResponse[];
}
