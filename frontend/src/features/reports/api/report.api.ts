import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { CreateReportPayload } from '../types/report.types';
import { api } from '@/shared/lib/api';

export const reportUser = async (payload: CreateReportPayload): Promise<void> => {
  const response = await api.post(API_ENDPOINT.REPORT.CREATE_USER, payload);
  return response.data;
};
