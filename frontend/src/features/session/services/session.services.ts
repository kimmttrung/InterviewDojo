import { api } from '@/shared/lib/api';
import { SessionFilters, SessionItem, PaginatedResponse } from '../types/session.types';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const getSessions = async (params: SessionFilters) => {
  const response = await api.get(API_ENDPOINT.SESSION.GET_ALL, { params });
  return response.data.data as PaginatedResponse<SessionItem>;
};

export const cancelSession = async (data: { sessionId: string; reason: string }) => {
  const response = await api.post(API_ENDPOINT.SESSION.CANCEL(data.sessionId), {
    reason: data.reason,
  });
  return response.data.data;
};

export const getMeetingLink = async (sessionId: number | string) => {
  const response = await api.post(`/sessions/${sessionId}/meeting-link`);
  console.log('check res', response);
  return response.data.data.meetingLink as string;
};

export const finishSession = async (sessionId: number | string) => {
  const response = await api.post(`/sessions/${sessionId}/finish`);
  return response.data;
};
