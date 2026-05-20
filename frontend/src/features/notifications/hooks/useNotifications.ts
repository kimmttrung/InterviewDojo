import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notification.api';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
