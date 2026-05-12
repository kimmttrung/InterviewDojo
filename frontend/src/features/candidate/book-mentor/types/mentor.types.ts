export type SkillLevel =
  | 'LEARNING'
  | 'PRACTICED'
  | 'PERSONAL_PROJECT'
  | 'PRODUCTION_READY'
  | 'EXPERT';

export type SkillType = 'SOFTSKILL' | 'HARDSKILL' | 'LANGUAGE';

export interface MentorSkill {
  id: number;
  name: string;
  type: SkillType;
  level: SkillLevel;
  experienceMonths: number;
  proofUrl?: string | null;
}

export interface MentorExperience {
  id: number;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  company: {
    id: number;
    name: string;
    logoUrl?: string | null;
  };
  jobRole: {
    id: number;
    name: string;
  };
}

export interface CoachingPlanQuestion {
  id: number;
  question: string;
  type: 'TEXT' | 'FILE';
  placeholder?: string | null;
  isRequired: boolean;
  orderIndex: number;
}

export interface CoachingPlan {
  id: number;
  title: string;
  description?: string | null;
  duration: number;
  price: number;
  questions: CoachingPlanQuestion[];
}

export interface MentorDetail {
  id: number;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  experienceYears: number;
  mentorProfile?: {
    headline?: string | null;
    introductionVideoUrl?: string | null;
  };
  skills: MentorSkill[];
  experiences: MentorExperience[];
  coachingPlans: CoachingPlan[];
}

export interface AvailableSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
}
