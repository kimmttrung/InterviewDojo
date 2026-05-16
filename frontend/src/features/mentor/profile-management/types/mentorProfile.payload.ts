// types/mentorProfile.payload.ts

export interface ExperiencePayload {
  id?: number;

  companyId: number;

  jobRoleId: number;

  startDate: string;

  endDate?: string;

  isCurrent: boolean;

  description?: string;

  proofUrl?: string;
}

export interface SkillPayload {
  id?: number;

  skillId: number;

  experienceMonths: number;

  level: string;

  proofUrl?: string;
}

export interface CoachingQuestionPayload {
  id?: number;

  question: string;

  type: 'TEXT' | 'FILE';

  isRequired?: boolean;
}

export interface CoachingPlanPayload {
  id?: number;

  title: string;

  description?: string;

  duration: number;

  price: number;

  categoryId: number;

  questions?: CoachingQuestionPayload[];
}

export interface SaveMentorProfilePayload {
  name: string;

  bio: string;

  avatarUrl: string;

  linkedInLink?: string;

  githubLink?: string;

  headline: string;

  introductionVideoUrl?: string;

  experiences: ExperiencePayload[];

  skills: SkillPayload[];

  coachingPlans: CoachingPlanPayload[];
}
