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
  submittedAt: Date | null;
  deadline: Date;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'SKIPPED';
  createdAt: Date;
}

export interface PartnerFeedbackResponse {
  overallScore: number;
  comment: string | null;
  quickTags: string[];
  strengths: string[] | null;
  weaknesses: string[] | null;
  suggestions: string[] | null;
}
