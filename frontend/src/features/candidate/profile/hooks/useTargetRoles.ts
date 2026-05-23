import { useQuery } from '@tanstack/react-query';

import { targetRoleService } from '@/features/candidate/target-role/services/target-role.service.ts';

export const useTargetRoles = () => {
  return useQuery({
    queryKey: ['targetRoles'],

    queryFn: async () => {
      const response = await targetRoleService.getAll();

      return response.data.data;
    },

    staleTime: 1000 * 60 * 10,
  });
};
