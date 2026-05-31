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

    const response = await api.get(`${API_ENDPOINT.MENTOR.GET_LIST}?${params.toString()}`);

    return response.data.data;
  },

  getRecommendations: async (candidateUserId: number) => {
    const response = await api.get(
      `${API_ENDPOINT.RECOMMENDATIONS.GET_FOR_CANDIDATE(candidateUserId)}`,
    );

    return response.data.data;
  },
};
