import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { queryKeys } from '../../../../shared/lib/queryKeys';

export const useStatistics = () => {
  return useQuery({
    queryKey: queryKeys.admin.statistics,
    queryFn: dashboardApi.getStatistics,
  });
};
