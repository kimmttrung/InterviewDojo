import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';
import type { DashboardStatistics } from '../types/dashboard.types';

export const dashboardApi = {
  getStatistics: async (): Promise<DashboardStatistics> => {
    const res = await api.get(API_ENDPOINT.ADMIN.STATISTICS);
    return res.data.data;
  },
};
