export interface SessionItem {
  id: string | number;
  type: string; // 'MENTOR', 'P2P', 'SOLO'
  status: string; // 'PENDING', 'UPCOMING', 'REJECTED', 'FINISHED'
  durationMinutes: number;
  opponentId: number | null;
  opponentName: string | null;
  opponentAvatar: string | null;
  coachingPlan: string | null;
  scheduledAt: string | null;
  createdAt: string;
  meetingLink: string | null;
  recordingUrl: string | null;
  rejectedReason: string | null;
  hasFeedback: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
