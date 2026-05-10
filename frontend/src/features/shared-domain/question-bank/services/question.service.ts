import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import type { GetQuestionsParams, RandomQuestionParams } from '../types/question.types';

export const questionService = {
  getAll: async (params?: GetQuestionsParams) => {
    const response = await api.get(API_ENDPOINT.QUESTIONS.GET_ALL, { params });
    return response.data; // { success, data: PaginatedResponse, message }
  },

  getById: async (id: string) => {
    const response = await api.get(API_ENDPOINT.QUESTIONS.GET_ONE(id));
    return response.data; // { success, data: QuestionDetail, message }
  },

  getRandom: async (params?: RandomQuestionParams) => {
    const response = await api.get(API_ENDPOINT.QUESTIONS.GET_RANDOM, { params });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post(API_ENDPOINT.QUESTIONS.CREATE, data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(API_ENDPOINT.QUESTIONS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(API_ENDPOINT.QUESTIONS.DELETE(id));
    return response.data;
  },
};
