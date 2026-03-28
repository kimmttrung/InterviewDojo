import { StreamClient } from '@stream-io/node-sdk'; // Tên mới của Client
import { Injectable } from '@nestjs/common';

@Injectable()
export class StreamService {
  private client: StreamClient;

  constructor() {
    const apiKey = process.env.STREAM_API_KEY!;
    const secretKey = process.env.STREAM_SECRET_KEY!;

    this.client = new StreamClient(apiKey, secretKey);
  }
  createToken(userId: string) {
    // Token hết hạn sau 1 giờ
    return this.client.generateUserToken({
      user_id: userId,
      validity_in_seconds: 3600,
    });
  }
}
