// types/mentor-detail.types.ts
export interface MentorExperience {
  id: number;
  companyName: string;
  companyLogoUrl?: string | null;
  roleName: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  company?: {
    id: number;
    name: string;
    logoUrl?: string | null;
    industry?: string | null;
  };
  jobRole?: {
    id: number;
    name: string;
    description?: string | null;
  };
}

export interface MentorSkill {
  id: number;
  name: string;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
  level: string;
  experienceMonths: number;
}

export interface CoachingPlan {
  id: number;
  title: string;
  description?: string | null;
  duration: number;
  price: number;
  questions?: Array<{
    id: number;
    question: string;
    type: 'TEXT' | 'FILE';
    placeholder?: string | null;
    isRequired: boolean;
    orderIndex?: number;
  }>;
}

export interface MentorDetail {
  id: number;
  name: string;
  email?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  experienceYears: number;
  linkedInLink?: string | null;
  githubLink?: string | null;
  mentorProfile?: {
    id?: number;
    headline?: string | null;
    introductionVideoUrl?: string | null;
    approvalStatus?: string;
    experiences?: MentorExperience[];
    createdAt?: string;
  } | null;
  skills?: MentorSkill[];
  coachingPlans?: CoachingPlan[];
  experiences?: MentorExperience[];
}

export interface AvailableSession {
  startTime: string;
  endTime: string;
}
