import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { SocketService } from '../socket/socket.service';
import { StreamService } from '../stream/stream.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchingService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly socketService: SocketService,
    private readonly streamService: StreamService,
  ) {}

  async handleJoinQueue(userId: number, level: string) {
    const queueKey = `queue:${level.toUpperCase()}`;
    const sUserId = userId.toString();

    // 1. Kiểm tra xem đối thủ cũ nhất trong hàng chờ là ai
    // Lấy người đầu tiên (score thấp nhất - đợi lâu nhất)
    const oldestWaiters = await this.redis.zrange(queueKey, 0, 0);
    const opponentId = oldestWaiters[0];

    // 2. Nếu có đối thủ và đối thủ không phải là chính mình
    if (opponentId && opponentId !== sUserId) {
      // ATOMIC: Cố gắng xóa đối thủ khỏi hàng chờ
      // Nếu xóa thành công (trả về 1), nghĩa là ta đã "chiếm" được đối thủ này
      const removed = await this.redis.zrem(queueKey, opponentId);

      if (removed === 1) {
        const roomId = uuidv4();

        try {
          // 3. Khởi tạo Call trên GetStream Server (Backend-side)
          await this.streamService.createCall(roomId, sUserId);

          // 4. Tạo Token cho cả 2
          const userToken = this.streamService.createToken(sUserId);
          const opponentToken = this.streamService.createToken(opponentId);

          // 5. Bắn Socket báo tin vui cho cả hai
          // User hiện tại (người vừa bấm nút)
          this.socketService.emitToUser(sUserId, 'match_found', {
            roomId,
            token: userToken,
            opponentId: parseInt(opponentId),
            role: 'interviewee',
          });

          // Đối thủ (người đang đợi sẵn)
          this.socketService.emitToUser(opponentId, 'match_found', {
            roomId,
            token: opponentToken,
            opponentId: userId,
            role: 'interviewer',
          });

          return { status: 'matched', roomId, token: userToken };
        } catch (error) {
          console.error('Stream Error:', error);
          // Nếu lỗi Stream, nên trả đối thủ lại vào queue hoặc báo lỗi
          throw new InternalServerErrorException(
            'Lỗi khởi tạo phòng phỏng vấn',
          );
        }
      }
    }

    // 3. Nếu không có ai hoặc không "cướp" được đối thủ, ta tự đưa mình vào hàng chờ
    await this.redis.zadd(queueKey, Date.now(), sUserId);
    return { status: 'in_queue', message: 'Đang tìm đối thủ phù hợp...' };
  }

  async handleLeaveQueue(userId: number, level: string) {
    const queueKey = `queue:${level.toUpperCase()}`;
    await this.redis.zrem(queueKey, userId.toString());
    return { status: 'left' };
  }
}
