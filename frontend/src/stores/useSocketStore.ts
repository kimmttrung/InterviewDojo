import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  joinedRooms: Set<string>; // Theo dõi các room đã join để tránh lặp

  connect: (userId: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  emit: (event: string, data: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  joinedRooms: new Set(),

  // ====================== CONNECT ======================
  connect: (userId: string) => {
    const current = get().socket;

    // Nếu đã connect rồi thì không tạo mới (tránh infinite loop)
    if (current?.connected) {
      return;
    }

    // Disconnect socket cũ nếu tồn tại
    if (current) {
      current.disconnect();
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log(`✅ Socket connected: ${newSocket.id}`);
      set({ socket: newSocket, isConnected: true });
    });

    // ✅ Re-join tất cả room đã đăng ký sau khi connect/reconnect
    const { joinedRooms } = get();
    joinedRooms.forEach((roomId) => {
      newSocket.emit('join_room', roomId);
      console.log(`🔄 Re-joined room: ${roomId}`);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      set({ isConnected: false });
    });

    // Reset danh sách room khi tạo socket mới
    set({
      socket: newSocket,
      isConnected: false,
      joinedRooms: new Set(),
    });
  },

  // ====================== DISCONNECT ======================
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, joinedRooms: new Set() });
    }
  },

  // ====================== JOIN ROOM ======================
  joinRoom: (roomId: string) => {
    const { socket, joinedRooms } = get();
    if (joinedRooms.has(roomId)) return;

    // Đăng ký vào danh sách trước (để re-join sau reconnect)
    set((state) => ({
      joinedRooms: new Set(state.joinedRooms).add(roomId),
    }));

    if (!socket) return;

    if (socket.connected) {
      socket.emit('join_room', roomId);
      console.log(`🏠 Joined room: ${roomId}`);
    } else {
      // Chưa connect xong → đợi connect event một lần
      socket.once('connect', () => {
        socket.emit('join_room', roomId);
        console.log(`🏠 Joined room (after connect): ${roomId}`);
      });
    }
  },

  leaveRoom: (roomId: string) => {
    const { socket, joinedRooms } = get();

    // Rời socket room
    if (socket?.connected) {
      socket.emit('leave_room', roomId);
    }

    // Xóa khỏi danh sách
    const newRooms = new Set(joinedRooms);
    newRooms.delete(roomId);
    set({ joinedRooms: newRooms });
    console.log('🚪 Left room:', roomId);
  },

  // ====================== EMIT ======================
  emit: (event: string, data: any) => {
    const { socket } = get();
    if (!socket) return;

    if (socket.connected) {
      socket.emit(event, data);
    } else {
      // Buffer: đợi connect rồi gửi (chỉ dùng cho các event quan trọng như join_room)
      socket.once('connect', () => {
        socket.emit(event, data);
      });
    }
  },
}));
