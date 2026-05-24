import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { BanFormData } from '../types/user.types';

export const userAdminApi = {
  getAll: (params: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    search?: string;
  }) => api.get(API_ENDPOINT.ADMIN.USERS, { params }),

  getOne: (id: number) => api.get(API_ENDPOINT.ADMIN.USER_DETAIL(id)),

  getReported: () => api.get(API_ENDPOINT.ADMIN.REPORTED_USERS),

  ban: (id: number, data: BanFormData) => api.post(API_ENDPOINT.ADMIN.BAN_USER(id), data),

  unban: (id: number) => api.post(API_ENDPOINT.ADMIN.UNBAN_USER(id)),
};
