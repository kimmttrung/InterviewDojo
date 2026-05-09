import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export const mentorProfileService = {
  createMentorProfile: (data: { cvUrl?: string; certificateUrl?: string }) => {
    return api.post(API_ENDPOINT.MENTOR.UPDATE_ME, data);
  },
};
