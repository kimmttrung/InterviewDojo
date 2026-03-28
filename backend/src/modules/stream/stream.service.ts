// src/modules/stream/stream.service.ts
import { StreamClient } from '@stream-io/node-sdk';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class StreamService {
  private client: StreamClient;

  constructor() {
    // Đảm bảo bạn đã đặt đúng tên biến trong file .env
    const apiKey = process.env.STREAM_API_KEY!;
    const secretKey = process.env.STREAM_SECRET_KEY!;

    if (!apiKey || !secretKey) {
      throw new Error(
        'STREAM_API_KEY hoặc STREAM_SECRET_KEY chưa được thiết lập',
      );
    }

    this.client = new StreamClient(apiKey, secretKey);
  }

  // 1. Tạo Token (Giữ nguyên của bạn, thêm bọc lỗi nếu cần)
  createToken(userId: string) {
    try {
      return this.client.generateUserToken({
        user_id: userId,
        validity_in_seconds: 3600, // 1 giờ
      });
    } catch (error) {
      console.error('Stream Token Error:', error);
      throw new InternalServerErrorException('Lỗi khi tạo Stream Token');
    }
  }

  // 2. THÊM: Hàm khởi tạo phòng trực tiếp từ Backend
  async createCall(roomId: string, userId: string) {
    try {
      // 'default' là loại cuộc gọi mặc định, roomId là mã duy nhất chúng ta tạo ra
      const call = this.client.video.call('default', roomId);

      // Tạo phòng trên Server GetStream
      await call.getOrCreate({
        data: {
          created_by_id: userId,
        },
      });

      return call;
    } catch (error) {
      console.error('Lỗi tạo phòng trên Stream:', error);
      throw new InternalServerErrorException('Không thể tạo phòng video');
    }
  }
}
