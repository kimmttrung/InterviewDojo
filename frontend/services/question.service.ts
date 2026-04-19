import { api } from '../lib/api';
import { API_ENDPOINT } from '../lib/endpoints';

export const questionService = {
  getAll: async (params?: any) => {
    // params bao gồm: page, limit, keyword, difficulty...
    const response = await api.get(API_ENDPOINT.QUESTIONS.GET_ALL, { params });
    return response.data; // Trả về object chứa { data, meta }
  },

  delete: async (id: number) => {
    return await api.delete(API_ENDPOINT.QUESTIONS.DELETE(id));
  },

  getById: async (id: string) => {
    return await api.get(API_ENDPOINT.QUESTIONS.GET_ONE(id));
  },
};
