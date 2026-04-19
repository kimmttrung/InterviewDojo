import { api } from '../lib/api';
import { API_ENDPOINT } from '../lib/endpoints';

export const categoryService = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINT.CATEGORIES.GET_ALL);
    return res.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await api.post(API_ENDPOINT.CATEGORIES.CREATE, data);
    return res.data;
  },
  update: async (id: number, data: { name?: string; description?: string }) => {
    const res = await api.put(API_ENDPOINT.CATEGORIES.UPDATE(id), data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(API_ENDPOINT.CATEGORIES.DELETE(id));
    return res.data;
  },
};
