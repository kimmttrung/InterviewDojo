// features/candidate/list-mentor/services/filter-options.service.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const filterOptionsService = {
  getRoles: async () => {
    const res = await api.get(API_ENDPOINT.TARGET_ROLE.GET);
    console.log('Roles: ', res.data);
    return res.data.data;
  },
  getCompanies: async () => {
    const res = await api.get(API_ENDPOINT.COMPANIES.GET_ALL);
    console.log('companies: ', res.data);
    return res.data.data;
  },
  getSkills: async () => {
    const res = await api.get(API_ENDPOINT.SKILLS.GET_ALL);
    console.log('skills: ', res.data);
    return res.data.data;
  },
  getCategories: async () => {
    const res = await api.get(API_ENDPOINT.COACHING_CATEGORIES.GET_ALL);
    console.log('category: ', res.data);
    return res.data.data;
  },
  getIndustries: async () => {
    const res = await api.get(API_ENDPOINT.COMPANIES.GET_INDUSTRIES);
    const data = res.data.data;
    return Array.isArray(data) ? data : [];
  },
};
