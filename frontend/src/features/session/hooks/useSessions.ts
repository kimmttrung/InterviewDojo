import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../services/session.services';
import { useSessionStore } from '../stores/useSessionStore';

export const useSessions = () => {
  const filters = useSessionStore((state) => state.filters);

  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => getSessions(filters),
    placeholderData: (previousData) => previousData,
  });
};
