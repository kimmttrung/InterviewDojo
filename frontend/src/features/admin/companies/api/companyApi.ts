import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import type { Company } from '../types/companies.types';

export const companyApi = {
  getAll: (): Promise<Company[]> =>
    api.get(API_ENDPOINT.COMPANIES.GET_ALL).then((res) => res.data.data),

  create: (data: { name: string; industry?: string; logoUrl?: string }): Promise<Company> =>
    api.post(API_ENDPOINT.COMPANIES.CREATE, data).then((res) => res.data.data),

  update: (
    id: number,
    data: { name?: string; industry?: string; logoUrl?: string },
  ): Promise<Company> =>
    api.put(API_ENDPOINT.COMPANIES.UPDATE(id), data).then((res) => res.data.data),

  delete: (id: number): Promise<void> => api.delete(API_ENDPOINT.COMPANIES.DELETE(id)),
};
