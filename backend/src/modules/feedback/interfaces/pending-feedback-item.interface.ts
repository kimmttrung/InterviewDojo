export interface PendingFeedbackItem {
  id: number;
  sessionId: number;
  revieweeName: string;
  revieweeAvatar: string | null;
  deadline: Date;
  sessionType: 'P2P' | 'MENTORING' | 'SOLO';
}
