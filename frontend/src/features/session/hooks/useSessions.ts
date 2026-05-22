import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../services/session.services';
import { useSessionStore } from '../stores/useSessionStore';

export const useSessions = () => {
  const filters = useSessionStore((state) => state.filters);

  return useQuery({
    queryKey: ['sessions', filters], // Query key thay đổi -> tự động fetch lại
    queryFn: () => getSessions(filters),
    placeholderData: (previousData) => previousData, // Giữ data cũ khi đang fetch trang mới (tránh giật UI)
  });
};
