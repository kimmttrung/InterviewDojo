// frontend/src/features/mentor/profile-management/hooks/useJobRoles.ts

import { useQuery } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useJobRoles = () => {
  return useQuery({
    queryKey: ['mentor-profile', 'job-roles'],
    queryFn: mentorProfileService.getJobRoles,
  });
};

export const useJobRole = (id?: number) => {
  return useQuery({
    queryKey: ['mentor-profile', 'job-role', id],
    queryFn: () => mentorProfileService.getJobRole(id as number),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
