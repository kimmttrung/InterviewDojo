// api/reportApi.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { UpdateReportStatusData } from '../types/report.types';

export const reportApi = {
  getAll: (params: { page: number; limit: number; status?: string; targetType?: string }) =>
    api.get(API_ENDPOINT.ADMIN.REPORTS, { params }),
  getOne: (id: number) => api.get(API_ENDPOINT.ADMIN.REPORT_DETAIL(id)),
  updateStatus: (id: number, data: UpdateReportStatusData) =>
    api.patch(API_ENDPOINT.ADMIN.UPDATE_REPORT_STATUS(id), data),
};
