import { api } from '../../../../shared/lib/api';
import type { AvailableSlot, MentorDetail } from '../types/mentor.types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export const getMentorDetail = async (mentorId: number) => {
  const response = await api.get<ApiResponse<MentorDetail>>(`/mentors/${mentorId}`);

  return response.data.data;
};

export const getMentorAvailableSlots = async (mentorId: number) => {
  const response = await api.get<ApiResponse<AvailableSlot[]>>(
    `/mentors/${mentorId}/available-slots`,
  );

  return response.data.data;
};

export const createBooking = async (data: {
  slotId: number;
  coachingPlanId: number;
  answers?: {
    questionId: number;
    answerText?: string;
    fileUrl?: string;
  }[];
}) => {
  const response = await api.post<ApiResponse<unknown>>('/bookings', data);
  return response.data.data;
};
