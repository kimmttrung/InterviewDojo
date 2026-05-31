// frontend/src/features/mentor/profile-management/hooks/useCoachingCategories.ts

import { useQuery } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useCoachingCategories = () => {
  return useQuery({
    queryKey: ['mentor-profile', 'coaching-categories'],
    queryFn: mentorProfileService.getCoachingCategories,
  });
};
