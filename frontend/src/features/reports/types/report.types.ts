// src/features/reports/types/report.types.ts
export interface CreateReportPayload {
  targetType: 'USER' | 'SYSTEM' | 'QUESTION';
  type: string;
  reason: string;
  evidenceUrls?: string[];
  targetUserId?: number;
  targetQuestionId?: number;
  snapshotQuestionTitle?: string;
}
