import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export const companyService = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINT.COMPANIES.GET_ALL);
    return res.data;
  },
  create: async (data: { name: string; logoUrl?: string }) => {
    const res = await api.post(API_ENDPOINT.COMPANIES.CREATE, data);
    return res.data;
  },
  update: async (id: number, data: { name?: string; logoUrl?: string }) => {
    const res = await api.put(API_ENDPOINT.COMPANIES.UPDATE(id), data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(API_ENDPOINT.COMPANIES.DELETE(id));
    return res.data;
  },
};
