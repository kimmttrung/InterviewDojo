export interface MentorDetail {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  introductionVideoUrl: string | null;
  skills: {
    id: number;
    name: string;
    type: 'HARD_SKILL' | 'SOFT_SKILL';
    level: 'LEARNING' | 'PRACTICED' | 'PROJECT_READY' | 'PROFESSIONAL';
    timeUse: number;
    description?: string | null;
  }[];
  experiences: {
    id: number;
    companyName: string;
    position: string;
    startDate: string;
    endDate: string | null;
  }[];
  services: {
    id: number;
    name: string;
    description: string | null;
    price: number;
  }[];
}
