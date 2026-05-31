// frontend/src/features/admin/questions/api/questionAdminApi.ts

import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { CreateQuestionPayload } from '../types/question.types';

function unwrap<T>(res: any): T {
  return res?.data?.data;
}

export const questionAdminApi = {
  getAll: <T = unknown>(params: any) =>
    api.get(API_ENDPOINT.ADMIN.QUESTIONS, { params }).then(unwrap<T>),
  getOne: <T = unknown>(id: number) =>
    api.get(API_ENDPOINT.ADMIN.QUESTION_DETAIL(id)).then(unwrap<T>),
  create: (data: CreateQuestionPayload) =>
    api.post(API_ENDPOINT.ADMIN.CREATE_QUESTION, data).then(unwrap),
  update: (id: number, data: CreateQuestionPayload) =>
    api.put(API_ENDPOINT.ADMIN.UPDATE_QUESTION(id), data).then(unwrap),
  delete: (id: number) => api.delete(API_ENDPOINT.ADMIN.DELETE_QUESTION(id)).then(unwrap),
};
