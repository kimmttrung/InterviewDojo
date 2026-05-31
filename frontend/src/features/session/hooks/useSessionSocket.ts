import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/useSocketStore';

export const useSessionSocket = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    };

    const handleSessionEnded = () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    };

    socket.on('SESSION_UPDATED', handleSessionUpdate);
    socket.on('SESSION_ACCEPTED', handleSessionUpdate);
    socket.on('SESSION_ENDED', handleSessionEnded);

    return () => {
      socket.off('SESSION_UPDATED', handleSessionUpdate);
      socket.off('SESSION_ACCEPTED', handleSessionUpdate);
      socket.off('SESSION_ENDED', handleSessionEnded);
    };
  }, [socket, queryClient]);
};
