import { api } from '../../../shared/lib/api';
import { API_ENDPOINT } from '../../../shared/lib/endpoints';

export const matchingService = {
  join: (data: { userId: number; level: string }) => api.post(API_ENDPOINT.MATCHING.JOIN, data),
};
