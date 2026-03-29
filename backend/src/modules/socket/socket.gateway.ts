// src/modules/socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
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
    const userId = client.handshake.query.userId as string;

    if (userId && userId !== 'undefined') {
      // User tự động gia nhập vào room cá nhân: user_1, user_2...
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

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId); // Gia nhập phòng phỏng vấn chung
    console.log(`User ${client.id} joined room: ${roomId}`);
  }

  @SubscribeMessage('send_code') // Sửa từ 'code_change' thành 'send_code'
  handleCodeChange(client: Socket, payload: { roomId: string; code: string }) {
    // Phát lại cho người kia với tên 'receive_code'
    client.to(payload.roomId).emit('receive_code', payload.code);
  }

  @SubscribeMessage('send_run_result')
  handleRunResult(
    @MessageBody() data: { roomId: string; result: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('receive_run_result', data.result);
  }
  @SubscribeMessage('send_language')
  handleLanguageChange(
    client: Socket,
    payload: { roomId: string; languageId: string },
  ) {
    // Gửi cho người còn lại trong phòng biết ngôn ngữ đã đổi
    client.to(payload.roomId).emit('receive_language', payload.languageId);
  }
}
