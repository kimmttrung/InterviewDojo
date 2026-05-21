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
}

export interface SessionItem {
  id: number | string;
  type: 'MENTOR' | 'P2P' | 'SOLO';
  status: SessionTab | string;
  opponent: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  coachingPlanName: string | null;
  candidateAnswers?: string; // Hiển thị cho Mentor
  scheduledAt: string; // ISO String
  createdAt: string;
  meetingLink: string | null;
  rejectedReason: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
