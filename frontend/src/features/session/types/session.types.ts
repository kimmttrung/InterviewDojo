export enum SessionTab {
  ALL = 'ALL',
  UPCOMING = 'UPCOMING',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  FINISHED = 'FINISHED',
}

export interface SessionFilters {
  tab: SessionTab;
  search: string;
  startDate: string | null;
  endDate: string | null;
  page: number;
  type?: string;
  statuses?: string;
}
export interface SessionItem {
  id: string | number;
  type: string; // 'MENTOR', 'P2P', 'SOLO'
  status: string; // 'PENDING', 'UPCOMING', 'REJECTED', 'FINISHED'
  durationMinutes: number;
  opponentId?: number | null;
  opponentName: string | null;
  opponentAvatar: string | null;
  coachingPlan: string | null;
  scheduledAt: string | null;
  createdAt: string;
  meetingLink: string | null;
  recordingUrl: string | null;
  rejectedReason: string | null;
  hasFeedback: boolean;
  candidateAnswers?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
