// features/candidate/mentor-booking/services/booking.service.ts

import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const bookingService = {
  getMentorDetail: (id: number) =>
    api.get(API_ENDPOINT.MENTORS.GET_ONE(id)).then((r) => r.data.data),

  getMentorPlans: (userId: number) => api.get(`/plans/users/${userId}`).then((r) => r.data.data),

  getAvailableDays: (mentorId: number, planId: number, month: string) =>
    api
      .get(`/slots/mentors/${mentorId}/available-days`, {
        params: { planId, month },
      })
      .then((r) => r.data.data),

  getAvailableSessions: (mentorId: number, planId: number, date: string) =>
    api
      .get(`/slots/mentors/${mentorId}/available-sessions`, {
        params: { planId, date },
      })
      .then((r) => r.data.data),

  // 🔥 THÊM API: Đẩy file đính kèm lên cổng /bookings/upload-attachment của Backend
  uploadAttachment: (formData: FormData) =>
    api
      .post('/bookings/upload-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data), // Trả về { secure_url: string, public_id: string }

  createBooking: (data: {
    coachingPlanId: number;
    startTime: string;
    endTime: string;
    answers?: {
      questionId: number;
      answerText?: string;
      fileUrl?: string;
    }[];
  }) => api.post('/bookings', data).then((r) => r.data.data),

  payBooking: (bookingId: number) =>
    api
      .post(`/bookings/${bookingId}/pay`, {
        method: 'INTERNAL_WALLET',
      })
      .then((r) => r.data.data),
};
