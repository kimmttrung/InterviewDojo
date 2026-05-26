import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import { CreateQuestionPayload } from '../types/question.types';

function unwrap<T>(res: any): T {
  return res?.data?.data;
}

export const questionAdminApi = {
  getAll: <T = unknown>(params: any) =>
    api.get(API_ENDPOINT.QUESTIONS.GET_ALL, { params }).then(unwrap<T>),
  getOne: <T = unknown>(id: number) =>
    api.get(API_ENDPOINT.QUESTIONS.GET_ONE(id.toString())).then(unwrap<T>),
  create: (data: CreateQuestionPayload) =>
    api.post(API_ENDPOINT.QUESTIONS.CREATE, data).then(unwrap),
  update: (id: number, data: CreateQuestionPayload) =>
    api.put(API_ENDPOINT.QUESTIONS.UPDATE(id), data).then(unwrap),
  delete: (id: number) => api.delete(API_ENDPOINT.QUESTIONS.DELETE(id)).then(unwrap),
};
