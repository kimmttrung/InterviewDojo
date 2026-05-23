import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

import { SkillOption } from '../types/skill';

export const skillService = {
  getAll: async (): Promise<SkillOption[]> => {
    const response = await api.get(API_ENDPOINT.SKILLS.GET_ALL);

    return response.data.data;
  },
};
