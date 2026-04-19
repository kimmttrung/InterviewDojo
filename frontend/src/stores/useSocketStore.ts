import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  joinedRooms: Set<string>;
  connect: (userId: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  emit: (event: string, data: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  joinedRooms: new Set(),

  connect: (userId: string) => {
    const currentSocket = get().socket;

    if (currentSocket?.connected && currentSocket?.id) {
      return;
    }

    if (currentSocket) {
      currentSocket.disconnect();
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      set({ socket: newSocket, isConnected: true });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ socket: newSocket, joinedRooms: new Set() });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinRoom: (roomId: string) => {
    const { socket, joinedRooms } = get();

    if (!socket?.connected) return;
    if (joinedRooms.has(roomId)) return; // ← Quan trọng: Không join lại nếu đã join

    socket.emit('join_room', roomId);

    set((state) => ({
      joinedRooms: new Set(state.joinedRooms).add(roomId),
    }));
  },

  emit: (event: string, data: any) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  },
}));
