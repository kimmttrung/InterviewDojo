import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { queryKeys } from '../../../../shared/lib/queryKeys';

export const useStatistics = () => {
  return useQuery({
    queryKey: queryKeys.admin.statistics,
    queryFn: dashboardApi.getStatistics,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

export const useGrowthChart = () => {
  return useQuery({
    queryKey: queryKeys.admin.statisticsGrowthChart,
    queryFn: dashboardApi.getGrowthChart,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopMentors = () => {
  return useQuery({
    queryKey: queryKeys.admin.statisticsTopMentors,
    queryFn: dashboardApi.getTopMentors,
    staleTime: 5 * 60 * 1000,
  });
};
