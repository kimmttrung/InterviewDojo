// frontend/src/features/mentor/profile-management/services/mentorProfile.service.ts

import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

import type { SaveMentorProfilePayload } from '../types/mentorProfile.payload';

import type {
  CoachingCategoryOption,
  CompanyOption,
  JobRoleOption,
  SkillOption,
} from '../types/mentorMasterData';

export const mentorProfileService = {
  // =========================
  // PROFILE
  // =========================

  getMyMentorProfile: async () => {
    const response = await api.get(API_ENDPOINT.MENTOR.GET_MY_PROFILE);

    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get(API_ENDPOINT.MENTOR.GET_MY_PROFILE);

    return response.data.data;
  },

  updateProfile: async (payload: SaveMentorProfilePayload) => {
    const response = await api.put(API_ENDPOINT.MENTOR.UPDATE_PROFILE, payload);

    return response.data.data;
  },

  // =========================
  // UPLOAD
  // =========================

  uploadIntroductionVideo: async (file: File) => {
    const formData = new FormData();

    formData.append('file', file);

    const response = await api.post(API_ENDPOINT.MENTOR.UPLOAD_INTRODUCTION_VIDEO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  // =========================
  // MASTER DATA
  // =========================

  getSkills: async (): Promise<SkillOption[]> => {
    const response = await api.get(API_ENDPOINT.SKILLS.GET_ALL);

    return response.data.data;
  },

  getCompanies: async (): Promise<CompanyOption[]> => {
    const response = await api.get(API_ENDPOINT.COMPANIES.GET_ALL);

    return response.data.data;
  },

  getJobRoles: async (): Promise<JobRoleOption[]> => {
    const response = await api.get(API_ENDPOINT.TARGET_ROLE.GET);

    return response.data.data;
  },

  getCoachingCategories: async (): Promise<CoachingCategoryOption[]> => {
    const response = await api.get(API_ENDPOINT.COACHING_CATEGORIES.GET_ALL);

    return response.data.data;
  },

  getCompany: async (id: number) => {
    const response = await api.get(API_ENDPOINT.COMPANIES.GET_ONE(id));
    return response.data.data;
  },

  getJobRole: async (id: number) => {
    const response = await api.get(API_ENDPOINT.TARGET_ROLE.GET_ONE(id));
    return response.data.data;
  },
};
