import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const mentorAdminApi = {
  getAll: (params: { page: number; limit: number; status?: string }) =>
    api.get(API_ENDPOINT.ADMIN.MENTORS, { params }),

  getById: (id: number) => api.get(API_ENDPOINT.ADMIN.MENTOR_DETAIL(id)),

  approve: (id: number) => api.post(API_ENDPOINT.ADMIN.APPROVE_MENTOR(id)),

  reject: (id: number, reason: string) =>
    api.post(API_ENDPOINT.ADMIN.REJECT_MENTOR(id), { reason }),
};
