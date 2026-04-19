import { data } from 'react-router-dom';
import { api } from '../lib/api';
import { API_ENPOINT } from '../lib/endpoints';

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  target_role?: string;
  experience_years?: number;
  avatar_url?: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileDto) => {
    const res = await api.put(API_ENPOINT.USER.UPDATE_ME, data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get(API_ENPOINT.USER.GET_ME);
    return res.data;
  },
  updateTargetRole: (data: { target_role_id: number }) => {
    return api.patch(API_ENPOINT.USER.UPDATE_TARGET_ROLE, data);
  },
  createMentorProfile: (data: { cvUrl?: string; certificateUrl?: string }) => {
    return api.post(API_ENPOINT.MENTOR.UPDATE_ME, data);
  },
};
