// src/features/admin/questions/api/jobRoleApi.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { JobRole } from '../types/question.types';

export const jobRoleApi = {
  getAll: (): Promise<JobRole[]> =>
    api.get(API_ENDPOINT.JOB_ROLES.GET_ALL).then((res) => res.data.data),
  create: (data: { name: string; description?: string }): Promise<JobRole> =>
    api.post(API_ENDPOINT.JOB_ROLES.CREATE, data).then((res) => res.data.data),
};
