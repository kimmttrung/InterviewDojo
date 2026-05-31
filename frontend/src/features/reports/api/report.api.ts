import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { CreateReportPayload } from '../types/report.types';
import { api } from '@/shared/lib/api';

export const reportUser = async (payload: CreateReportPayload | FormData): Promise<void> => {
  // Nếu là FormData (gửi kèm file)
  if (payload instanceof FormData) {
    const response = await api.post(API_ENDPOINT.REPORT.CREATE_USER, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  // Nếu là object JSON (gửi URL thủ công)
  const response = await api.post(API_ENDPOINT.REPORT.CREATE_USER, payload);
  return response.data;
};
export interface ReportCommentPayload {
  commentId: number;
  reason: string;
}

export const reportComment = async (payload: ReportCommentPayload): Promise<void> => {
  const response = await api.post(API_ENDPOINT.REPORT.CREATE_COMMENT, payload);
  return response.data;
};
