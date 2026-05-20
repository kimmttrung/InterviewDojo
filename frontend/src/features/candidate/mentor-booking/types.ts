// features/candidate/mentor-booking/types.ts

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
  duration: number; // minutes
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
  skills: {
    id: number;
    name: string;
    type: string;
    level: string;
    experienceMonths: number;
  }[];
  experiences: {
    id: number;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    company: {
      id: number;
      name: string;
      logoUrl?: string | null;
      industry?: string | null;
    };
    jobRole: {
      id: number;
      name: string;
      description?: string | null;
    };
  }[];
  coachingPlans: CoachingPlan[];
}

export interface AvailableSession {
  startTime: string; // ISO string
  endTime: string;
}
