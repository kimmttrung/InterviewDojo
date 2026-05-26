export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type ReportTargetType = 'USER' | 'QUESTION' | 'SYSTEM';
export type ReportType =
  | 'HARASSMENT'
  | 'SCAM'
  | 'FAKE_PROFILE'
  | 'NO_SHOW'
  | 'CHEATING'
  | 'PAYMENT_OUTSIDE'
  | 'ROOM_CREATION_FAILED'
  | 'PAYMENT_ERROR'
  | 'MATCHING_ERROR'
  | 'OTHER_SYSTEM'
  | 'WRONG_ANSWER'
  | 'INAPPROPRIATE_CONTENT'
  | 'DUPLICATE'
  | 'OTHER_QUESTION';

export interface Report {
  id: number;
  reporterId: number;
  reporterName: string;
  type: ReportType;
  targetType: ReportTargetType;
  reason: string;
  evidenceUrls: string[];
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  targetUserId: number | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  targetQuestionId: number | null;
  snapshotQuestionTitle: string | null;
}

export interface UpdateReportStatusData {
  status: ReportStatus;
  adminNote?: string;
}
