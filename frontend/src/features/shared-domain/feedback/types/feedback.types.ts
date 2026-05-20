// shared-domain/feedback/types/feedback.types.ts
export enum FeedbackStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  SKIPPED = 'SKIPPED',
}

export interface FeedbackRequest {
  overallScore: number; // 1-5
  quickTags?: string[];
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  comment?: string;
}

export interface FeedbackResponse {
  id: number;
  sessionId: number;
  reviewerId: number;
  revieweeId: number;
  strengths: string[] | null;
  weaknesses: string[] | null;
  suggestions: string[] | null;
  overallScore: number;
  comment: string | null;
  quickTags: string[];
  submittedAt: string | null;
  deadline: string;
  status: FeedbackStatus;
  createdAt: string;
}

export interface PartnerFeedbackResponse {
  overallScore: number;
  comment: string | null;
  quickTags: string[];
  strengths: string[] | null;
  weaknesses: string[] | null;
  suggestions: string[] | null;
}

export type FeedbackMode = 'P2P' | 'CANDIDATE_TO_MENTOR' | 'MENTOR_TO_CANDIDATE';
