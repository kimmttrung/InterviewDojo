import { useCurrentUser } from '@/features/auth';

export const useProfile = () => {
  const query = useCurrentUser();

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
