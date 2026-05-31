import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const mentorOptionsService = {
  getRoles: async () => {
    const response = await api.get(API_ENDPOINT.TARGET_ROLE.GET);

    return response.data.data;
  },

  getCompanies: async () => {
    const response = await api.get(API_ENDPOINT.COMPANIES.GET_ALL);

    return response.data.data;
  },

  getSkills: async () => {
    const response = await api.get(API_ENDPOINT.SKILLS.GET_ALL);

    return response.data.data;
  },

  getCategories: async () => {
    const response = await api.get(API_ENDPOINT.COACHING_CATEGORIES.GET_ALL);

    return response.data.data;
  },
};
