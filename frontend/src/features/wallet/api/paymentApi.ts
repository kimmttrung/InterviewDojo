import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const paymentApi = {
  deposit: (amount: number) => api.post(API_ENDPOINT.PAYMENT.DEPOSIT, { amount }),

  mockSuccess: (paymentId: number) => api.post(API_ENDPOINT.PAYMENT.MOCK_SUCCESS(paymentId)),
};
