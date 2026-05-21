import { api } from '@/shared/lib/api';
import { SessionFilters, SessionItem, PaginatedResponse } from '../types/session.types';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const getSessions = async (params: SessionFilters) => {
  const { data } = await api.get<PaginatedResponse<SessionItem>>(API_ENDPOINT.SESSION.GET_ALL, {
    params,
  });
  return data;
};

export const cancelSession = async (data: { sessionId: string; reason: string }) => {
  const res = await api.post(API_ENDPOINT.SESSION.CANCEL(data.sessionId), { reason: data.reason });
  return res.data;
};
