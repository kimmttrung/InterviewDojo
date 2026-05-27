// hooks/useCursorSync.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocketStore } from '@/stores/useSocketStore';
import { useCurrentUser } from '@/features/auth';

const getUserColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export interface CursorData {
  userId: string;
  displayName: string;
  color: string;
  x: number;
  y: number;
}

export function useCursorSync(roomId: string, enabled: boolean = true) {
  const { socket, emit } = useSocketStore();
  const { data: currentUser } = useCurrentUser();
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const throttleRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ x: number; y: number } | null>(null);

  const sendMouseMove = useCallback(
    (x: number, y: number) => {
      if (!socket || !roomId || !currentUser?.id || !enabled) {
        console.log('🐭 sendMouseMove blocked:', {
          socket: !!socket,
          roomId,
          userId: currentUser?.id,
          enabled,
        });
        return;
      }
      if (throttleRef.current) return;
      throttleRef.current = window.setTimeout(() => {
        throttleRef.current = null;
        if (lastSentRef.current?.x === x && lastSentRef.current?.y === y) return;
        lastSentRef.current = { x, y };
        emit('mouse_move', {
          roomId,
          x,
          y,
          userId: String(currentUser.id),
          displayName: currentUser.fullName || currentUser.email || `User ${currentUser.id}`,
          color: getUserColor(String(currentUser.id)),
        });
        console.log(`🖱️ Sent mouse: (${x}, ${y})`);
      }, 33);
    },
    [socket, roomId, currentUser, enabled, emit],
  );

  useEffect(() => {
    if (!socket || !roomId || !enabled) return;

    const handleMouseMove = (data: any) => {
      const { userId, x, y, displayName, color } = data;
      if (userId === String(currentUser?.id)) return;
      console.log(`📡 Received mouse from ${userId}: (${x}, ${y})`);
      setCursors((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, {
          userId,
          displayName: displayName || `User ${userId.slice(0, 5)}`,
          color: color || getUserColor(userId),
          x,
          y,
        });
        return newMap;
      });
    };

    socket.on('mouse_move', handleMouseMove);
    return () => {
      socket.off('mouse_move', handleMouseMove);
    };
  }, [socket, roomId, currentUser?.id, enabled]);

  // Xóa con trỏ khi rời phòng (tuỳ chọn)
  useEffect(() => {
    if (!socket) return;
    const handleDisconnect = () => setCursors(new Map());
    socket.on('disconnect', handleDisconnect);
    return () => socket.off('disconnect', handleDisconnect);
  }, [socket]);

  return { cursors, sendMouseMove };
}
