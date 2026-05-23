// src/features/users/hooks/useUserProfile.ts
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { UserPublicProfile } from '../types/user.types';
import { api } from '@/shared/lib/api';

const getUserProfile = async (userId: number): Promise<UserPublicProfile> => {
  const endpoint = API_ENDPOINT.USER.GET_BY_ID.replace(':id', userId.toString());
  const response = await api.get(endpoint);
  // response.data.data theo chuẩn backend { success, data, message }
  console.log('res', response);
  return response.data.data.data;
};

export const useUserProfile = (userId: number | null) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
