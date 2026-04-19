import { api } from '../lib/api';
import { API_ENDPOINT } from '../lib/endpoints';

export const matchingService = {
  join: (data: { userId: number; level: string }) => api.post(API_ENDPOINT.MATCHING.JOIN, data),
};
