export interface ExperienceItem {
  id?: number;

  companyId: number;

  jobRoleId: number;

  startDate: string;

  endDate?: string;

  isCurrent: boolean;

  description?: string;
}

export interface SkillItem {
  id?: number;

  skillId: number;

  experienceMonths: number;

  level: string;

  proofUrl?: string;
}

export interface CoachingPlanItem {
  id?: number;

  title: string;

  description?: string;

  duration: number;

  price: number;

  categoryId: number;
}

export interface SaveMentorProfilePayload {
  name: string;

  bio: string;

  avatarUrl: string;

  linkedInLink: string;

  githubLink: string;

  headline: string;

  introductionVideoUrl: string;

  experiences: ExperienceItem[];

  skills: SkillItem[];

  coachingPlans: CoachingPlanItem[];
}

// =========================
// OPTIONS
// =========================

export interface SkillOption {
  id: number;

  name: string;

  type: 'SOFTSKILL' | 'HARDSKILL' | 'LANGUAGE';
}

export interface CompanyOption {
  id: number;

  name: string;

  logoUrl?: string;

  industry?: string;
}

export interface JobRoleOption {
  id: number;

  name: string;

  description?: string;
}

export interface CoachingCategoryOption {
  id: number;

  name: string;

  slug: string;

  description?: string;
}

// =========================
// ALIAS
// =========================

export type MentorProfilePayload = SaveMentorProfilePayload;
