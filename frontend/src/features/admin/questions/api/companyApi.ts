import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { Company } from '../types/question.types';

export const companyApi = {
  getAll: (): Promise<Company[]> =>
    api.get(API_ENDPOINT.COMPANIES.GET_ALL).then((res) => res.data.data),
  create: (data: { name: string; industry?: string; logoUrl?: string }): Promise<Company> =>
    api.post(API_ENDPOINT.COMPANIES.CREATE, data).then((res) => res.data.data),
};
