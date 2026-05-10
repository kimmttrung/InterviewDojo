import { ApprovalStatus } from '@prisma/client';

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
  } | null;
}
