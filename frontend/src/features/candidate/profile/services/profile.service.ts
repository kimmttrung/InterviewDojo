import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  target_role?: string;
  experience_years?: number;
  avatar_url?: string;
}

export const profileService = {
  updateProfile: async (data: UpdateProfileDto) => {
    const res = await api.put(API_ENDPOINT.USER.UPDATE_ME, data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get(API_ENDPOINT.USER.GET_ME);
    return res.data;
  },
  updateTargetRole: (data: { target_role_id: number }) => {
    return api.patch(API_ENDPOINT.USER.UPDATE_TARGET_ROLE, data);
  },
  createMentorProfile: (data: { cvUrl?: string; certificateUrl?: string }) => {
    return api.post(API_ENDPOINT.MENTOR.UPDATE_ME, data);
  },
};
