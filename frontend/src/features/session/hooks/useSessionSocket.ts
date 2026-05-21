import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/useSocketStore';

export const useSessionSocket = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = () => {
      // Khi có thay đổi từ server (bị huỷ, có link meet, v.v), vô hiệu hoá cache
      // TanStack Query sẽ tự động gọi lại API ngầm mà không làm giật UI
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    };

    socket.on('SESSION_UPDATED', handleSessionUpdate);
    socket.on('SESSION_ACCEPTED', handleSessionUpdate);

    return () => {
      socket.off('SESSION_UPDATED', handleSessionUpdate);
      socket.off('SESSION_ACCEPTED', handleSessionUpdate);
    };
  }, [socket, queryClient]);
};
