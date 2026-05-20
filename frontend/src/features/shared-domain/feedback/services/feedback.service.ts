// shared-domain/feedback/api/feedback.api.ts
import { api } from '@/shared/lib/api'; // instance có interceptor
import { API_ENDPOINT } from '@/shared/lib/endpoints';
import {
  FeedbackRequest,
  FeedbackResponse,
  PartnerFeedbackResponse,
} from '../types/feedback.types';

export const feedbackApi = {
  submit: (sessionId: number, data: FeedbackRequest) =>
    api.post<{ data: FeedbackResponse }>(API_ENDPOINT.FEEDBACK.SUBMIT(sessionId), data),

  getMyFeedback: (sessionId: number) =>
    api.get<{ data: FeedbackResponse | null }>(API_ENDPOINT.FEEDBACK.MY_FEEDBACK(sessionId)),

  getPartnerFeedback: (sessionId: number) =>
    api.get<{ data: PartnerFeedbackResponse | null }>(
      API_ENDPOINT.FEEDBACK.PARTNER_FEEDBACK(sessionId),
    ),

  getPendingList: (page = 1, limit = 10) =>
    api.get<{ data: { items: any[]; meta: any } }>(API_ENDPOINT.FEEDBACK.PENDING_LIST, {
      params: { page, limit },
    }),

  getMyReceivedFeedbacks: () => api.get<{ data: any[] }>(API_ENDPOINT.FEEDBACK.MY_RECEIVED),
};
