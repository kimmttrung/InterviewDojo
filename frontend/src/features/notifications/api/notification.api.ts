import { api } from '../../../shared/lib/api';
import { API_ENDPOINT } from '../../../shared/lib/endpoints';
import type { NotificationResponse } from '../types/notification.types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export const getMyNotifications = async () => {
  const res = await api.get<ApiResponse<NotificationResponse>>(API_ENDPOINT.NOTIFICATIONS.GET_MY);

  return res.data.data;
};

export const markNotificationAsRead = async (id: number) => {
  const res = await api.patch(API_ENDPOINT.NOTIFICATIONS.MARK_READ(id));

  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.patch(API_ENDPOINT.NOTIFICATIONS.MARK_ALL_READ);

  return res.data;
};
