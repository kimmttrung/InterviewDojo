// src/modules/socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Trong thực tế hãy giới hạn domain của Vite (ví dụ: http://localhost:5173)
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly socketService: SocketService) {}

  // Gán server vào service sau khi khởi tạo xong
  afterInit(server: Server) {
    this.socketService.socketServer = server;
    console.log('--- Socket.io Server Initialized ---');
  }

  // Xử lý khi có người kết nối
  handleConnection(client: Socket) {
    // Lấy dữ liệu thô
    const queryUserId = client.handshake.query.userId;

    // Ép nó về kiểu string duy nhất (Nếu là mảng thì lấy cái đầu tiên)
    const userId = Array.isArray(queryUserId) ? queryUserId[0] : queryUserId;

    if (userId && userId !== 'undefined') {
      client.join(`user_${userId}`);
      console.log(`📡 User connected: ${userId} (SocketID: ${client.id})`);
    } else {
      console.log(`⚠️ Anonymous connection attempt (SocketID: ${client.id})`);
      client.disconnect();
    }
  }

  // Xử lý khi ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
  }
}
