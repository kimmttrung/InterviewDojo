import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export const mentorApi = {
  getMentors: async () => {
    const res = await api.get(API_ENDPOINT.MENTORS.GET_ALL);
    return res.data.data ?? res.data;
  },

  getMentorDetail: async (mentorId: number | string) => {
    const res = await api.get(API_ENDPOINT.MENTORS.GET_ONE(mentorId));
    return res.data.data ?? res.data;
  },

  getAvailableSlots: async (mentorId: number | string) => {
    const res = await api.get(API_ENDPOINT.MENTORS.GET_AVAILABLE_SLOTS(mentorId));
    return res.data.data ?? res.data;
  },
};
