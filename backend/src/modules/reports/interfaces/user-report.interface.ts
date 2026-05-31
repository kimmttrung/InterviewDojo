import { PaginatedResponse } from '@/common/interfaces/pagination.interface';
export interface UserReportItem {
  id: number;
  reporterId: number;
  reporterName: string;
  type: string;
  targetType: string;
  reason: string;
  evidenceUrls: string[];
  status: string;
  adminNote: string | null;
  createdAt: string;

  // Context fields (camelCase)
  targetUserId: number | null;
  targetUserEmail?: string | null;
  targetUserName?: string | null;
  targetQuestionId: number | null;
  snapshotQuestionTitle: string | null;

  targetCommentId: number | null;
  targetCommentContent?: string | null;
}

export type ReportsPaginatedResponse = PaginatedResponse<UserReportItem>;
