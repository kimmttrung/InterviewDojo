// src/features/admin/questions/api/categoryApi.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const categoryApi = {
  getAll: () => api.get(API_ENDPOINT.CATEGORIES.GET_ALL).then((res) => res.data.data),
  create: (data: { name: string; description?: string }) =>
    api.post(API_ENDPOINT.CATEGORIES.CREATE, data).then((res) => res.data.data),
};
