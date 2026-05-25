import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../services/session.services';
import { useSessionStore } from '../stores/useSessionStore';
export const useSessionsByType = (type: string, status?: string) => {
  const filters = useSessionStore((state) => state.filters);
  return useQuery({
    queryKey: ['sessions', type, status, filters],
    queryFn: () => getSessions({ ...filters, type, statuses: status || undefined }),
    placeholderData: (previousData) => previousData,
  });
};
