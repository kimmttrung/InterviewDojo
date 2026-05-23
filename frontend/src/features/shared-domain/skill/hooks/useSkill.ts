import { useQuery } from '@tanstack/react-query';

import { skillService } from '@/features/shared-domain/skill/services/skill.service';

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],

    queryFn: skillService.getAll,

    staleTime: 1000 * 60 * 10,
  });
};
