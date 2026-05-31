import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export interface MentorPayout {
  id: number;
  mentorEarning: number;
  grossAmount?: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  createdAt: string;
}

export interface PayoutsResponse {
  items: MentorPayout[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export const mentorPayoutService = {
  getMyPayouts: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PayoutsResponse> => {
    const response = await api.get(API_ENDPOINT.MENTOR.PAYOUTS, { params });
    return response.data.data;
  },
};
