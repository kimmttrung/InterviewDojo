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
  // const { socket, emit, joinRoom } = useSocketStore();
  const { data: currentUser } = useCurrentUser();
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const throttleRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ x: number; y: number } | null>(null);

  const joinRoom = useSocketStore((s) => s.joinRoom);

  // ✅ Join room, và re-join mỗi khi socket thay đổi
  useEffect(() => {
    if (!roomId || !enabled) return;

    // Join ngay lập tức với socket hiện tại
    joinRoom(roomId);

    // Subscribe để re-join khi socket bị thay thế (remount/reconnect)
    const unsubscribe = useSocketStore.subscribe((state, prevState) => {
      if (state.socket !== prevState.socket && state.socket) {
        console.log('🔄 Socket changed, re-joining room:', roomId);
        joinRoom(roomId);
      }
    });

    return () => unsubscribe();
  }, [roomId, enabled, joinRoom]);

  const sendMouseMove = useCallback(
    (x: number, y: number) => {
      if (!roomId || !currentUser?.id || !enabled) return;
      if (throttleRef.current) return;

      throttleRef.current = window.setTimeout(() => {
        throttleRef.current = null;
        if (lastSentRef.current?.x === x && lastSentRef.current?.y === y) return;
        lastSentRef.current = { x, y };

        // ✅ Lấy socket tại thời điểm gọi, không phải lúc tạo closure
        const { socket } = useSocketStore.getState();
        if (!socket?.connected) return;

        socket.emit('mouse_move', {
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
    [roomId, currentUser, enabled],
    // ✅ Không có socket trong deps
  );

  // ✅ Listener dùng subscribe để bắt socket mới ngay khi thay đổi
  useEffect(() => {
    if (!roomId || !enabled || !currentUser?.id) return;

    // Hàm attach listener vào một socket cụ thể, trả về cleanup
    const attachListener = (socket: ReturnType<typeof useSocketStore.getState>['socket']) => {
      if (!socket) return () => {};

      const handleMouseMove = (data: any) => {
        const { userId, x, y, displayName, color } = data;
        if (userId === String(currentUser.id)) return;
        console.log(`📡 Received mouse from ${userId}: (${x}, ${y})`);

        setCursors((prev) => {
          const next = new Map(prev);
          next.set(userId, {
            userId,
            displayName: displayName || `User ${userId.slice(0, 5)}`,
            color: color || getUserColor(userId),
            x,
            y,
          });
          return next;
        });
      };

      socket.on('mouse_move', handleMouseMove);
      console.log('👂 Attached mouse_move listener');
      return () => {
        socket.off('mouse_move', handleMouseMove);
        console.log('🗑️ Removed mouse_move listener');
      };
    };

    // Attach vào socket hiện tại ngay lập tức
    let cleanup = attachListener(useSocketStore.getState().socket);

    // Khi socket thay đổi → gỡ listener cũ, gắn listener mới
    const unsubscribe = useSocketStore.subscribe((state, prevState) => {
      if (state.socket !== prevState.socket) {
        cleanup();
        cleanup = attachListener(state.socket);
      }
    });

    return () => {
      cleanup();
      unsubscribe();
    };
  }, [roomId, currentUser?.id, enabled]);

  // ✅ Clear cursors khi mất kết nối
  useEffect(() => {
    const unsubscribe = useSocketStore.subscribe((state, prevState) => {
      if (prevState.isConnected && !state.isConnected) {
        setCursors(new Map());
      }
    });
    return () => unsubscribe();
  }, []);

  return { cursors, sendMouseMove };
}
