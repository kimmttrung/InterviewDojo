// frontend/src/features/mentor/profile-management/hooks/useSkills.ts

import { useQuery } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useSkills = () => {
  return useQuery({
    queryKey: ['mentor-profile', 'skills'],
    queryFn: mentorProfileService.getSkills,
  });
};
