import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import {
  CreateCoachingCategoryDto,
  UpdateCoachingCategoryDto,
} from '../types/coaching-category.types';

export const coachingCategoryApi = {
  getAll: () => api.get(API_ENDPOINT.COACHING_CATEGORIES.GET_ALL),
  create: (data: CreateCoachingCategoryDto) =>
    api.post(API_ENDPOINT.COACHING_CATEGORIES.CREATE, data),
  update: (id: number, data: UpdateCoachingCategoryDto) =>
    api.put(API_ENDPOINT.COACHING_CATEGORIES.UPDATE(id), data),
  delete: (id: number) => api.delete(API_ENDPOINT.COACHING_CATEGORIES.DELETE(id)),
};
