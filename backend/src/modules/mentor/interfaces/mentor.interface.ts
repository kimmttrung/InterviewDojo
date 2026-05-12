import { ApprovalStatus, SkillType, SkillLevel } from '@prisma/client';

export interface MentorResponse {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  experienceYears: number;
  avatarUrl: string | null;
  linkedInLink: string | null;
  githubLink: string | null;
  createdAt: Date;
  mentorProfile: {
    id: number;
    headline: string;
    introductionVideoUrl: string | null;
    approvalStatus: ApprovalStatus;
    createdAt: Date;
    experiences?: MentorExperience[];
  } | null;
  skills?: MentorSkill[];
}

export interface MentorExperience {
  id: number;
  description: string | null;
  isCurrent: boolean;
  startDate: Date;
  endDate: Date | null;
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
    industry: string | null;
  };
  jobRole: { id: number; name: string };
}

export interface MentorSkill {
  id: number;
  name: string;
  type: SkillType;
  level: SkillLevel;
  experienceMonths: number;
}

export interface PaginatedMentorResponse {
  items: MentorResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
