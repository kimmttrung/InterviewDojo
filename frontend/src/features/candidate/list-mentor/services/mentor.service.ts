// features/candidate/list-mentor/services/mentor.service.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export interface MentorFilters {
  page?: number;
  limit?: number;
  roleIds?: number[];
  companyIds?: number[];
  industry?: string;
  skillIds?: number[];
  categoryIds?: number[];
  search?: string;
}

export const mentorService = {
  list: async (filters: MentorFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });
    const res = await api.get(`${API_ENDPOINT.MENTOR.GET_LIST}?${params.toString()}`);
    return res.data.data; // { items, meta }
  },
};
