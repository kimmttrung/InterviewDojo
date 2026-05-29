import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export type MentorPayoutStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED';

export interface MentorPayoutQuery {
  page?: number;
  limit?: number;
  status?: MentorPayoutStatus;
}

export interface RejectMentorPayoutPayload {
  reason: string;
  refundableAmount?: number;
}

export const adminMentorPayoutApi = {
  getPayouts: (params: MentorPayoutQuery) =>
    api.get(API_ENDPOINT.ADMIN.MENTOR_PAYOUTS, { params }).then((res) => res.data.data),

  approvePayout: (id: number) =>
    api.post(API_ENDPOINT.ADMIN.APPROVE_MENTOR_PAYOUT(id)).then((res) => res.data.data),

  rejectPayout: (id: number, payload: RejectMentorPayoutPayload) =>
    api.post(API_ENDPOINT.ADMIN.REJECT_MENTOR_PAYOUT(id), payload).then((res) => res.data.data),
};
