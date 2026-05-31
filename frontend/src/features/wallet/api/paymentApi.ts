import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const paymentApi = {
  deposit: (amount: number) => api.post(API_ENDPOINT.PAYMENT.DEPOSIT, { amount }),

  getStatus: (paymentId: number) => api.get(API_ENDPOINT.PAYMENT.STATUS(paymentId)),

  mockSuccess: (paymentId: number) => api.post(API_ENDPOINT.PAYMENT.MOCK_SUCCESS(paymentId)),
};
