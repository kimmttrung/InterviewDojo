import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export interface UpdateMentorProfileDto {
  name?: string;
  bio?: string;
  experienceYears?: number;
  cvUrl?: string;
  certificateUrl?: string;
}

export const mentorService = {
  updateProfile: (data: UpdateMentorProfileDto) => {
    return api.put(API_ENDPOINT.MENTOR.UPDATE_ME, data);
  },
};
