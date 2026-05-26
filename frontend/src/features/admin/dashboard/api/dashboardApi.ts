import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';
import type { DashboardStatistics, GrowthChartItem, TopMentor } from '../types/dashboard.types';

export const dashboardApi = {
  getStatistics: async (): Promise<DashboardStatistics> => {
    const res = await api.get(API_ENDPOINT.ADMIN.STATISTICS);
    return res.data.data;
  },

  getGrowthChart: async (): Promise<GrowthChartItem[]> => {
    const res = await api.get(API_ENDPOINT.ADMIN.STATISTICS_GROWTH_CHART);
    return res.data.data;
  },

  getTopMentors: async (): Promise<TopMentor[]> => {
    const res = await api.get(API_ENDPOINT.ADMIN.STATISTICS_TOP_MENTORS);
    return res.data.data;
  },
};
