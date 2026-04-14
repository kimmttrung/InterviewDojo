import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  public socketServer!: Server;

  /**
   * Gửi dữ liệu cho một User cụ thể dựa trên ID
   * @param userId ID của người nhận
   * @param event Tên sự kiện (vídụ: 'match_success')
   * @param data Dữ liệu gửi đi
   */
  emitToUser(userId: string | number, event: string, data: any) {
    if (this.socketServer) {
      // Gửi vào room riêng của user đó
      this.socketServer.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Gửi dữ liệu cho toàn bộ hệ thống
   */
  emitToAll(event: string, data: any) {
    if (this.socketServer) {
      this.socketServer.emit(event, data);
    }
  }
}
