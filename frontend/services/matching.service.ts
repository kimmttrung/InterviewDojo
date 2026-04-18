import { api } from '../lib/api';
import { API_ENPOINT } from '../lib/endpoints';

export const matchingService = {
  join: (data: { userId: number; level: string }) => api.post(API_ENPOINT.MATCHING.JOIN, data),
};
