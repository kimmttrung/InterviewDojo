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

  createBooking: (data: {
    coachingPlanId: number;
    startTime: string;
    endTime: string;
    answers?: { questionId: number; answerText?: string; fileUrl?: string }[];
  }) => api.post('/bookings', data).then((r) => r.data.data),

  payBooking: (bookingId: number) =>
    api.post(`/bookings/${bookingId}/pay`).then((r) => r.data.data),
};
