// src/features/auth/hooks/useCurrentUser.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { useAuthStore } from '@/stores/useAuthStore';

export const useCurrentUser = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['current-user'],
    queryFn: userService.getMe,
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000,
  });
};
