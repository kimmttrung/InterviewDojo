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

    await this.redis.zrem(queueKey, sUserId);

    // KIỂM TRA ĐỐI THỦ
    let opponentId: string | null = null;

    // Vòng lặp tìm đối thủ thực sự online
    while (true) {
      // Lấy và xóa người đứng đầu hàng chờ (Atomic)
      const popped = await this.redis.zpopmin(queueKey);
      if (!popped || popped.length === 0) break;

      const [targetId] = popped;
      console.log(`🔍 Kiểm tra đối thủ tiềm năng: ${targetId}`);

      // Kiểm tra online
      if (this.socketService.isUserOnline(targetId)) {
        opponentId = targetId;
        break;
      } else {
        console.log(`🧹 Xóa Zombie: ${targetId}`);
        // Không đẩy lại vào hàng chờ vì họ offline
      }
    }

    // NẾU TÌM ĐƯỢC ĐỐI THỦ HỢP LỆ
    if (opponentId) {
      const roomId = uuidv4();
      try {
        // Tạo call và token
        await this.streamService.createCall(roomId, sUserId);
        const userToken = this.streamService.createToken(sUserId);
        const opponentToken = this.streamService.createToken(opponentId);

        // Bắn Socket cho cả hai
        this.socketService.emitToUser(sUserId, 'match_found', {
          roomId,
          token: userToken,
          opponentId: parseInt(opponentId),
          role: 'interviewee',
        });

        this.socketService.emitToUser(opponentId, 'match_found', {
          roomId,
          token: opponentToken,
          opponentId: userId,
          role: 'interviewer',
        });

        return { status: 'matched', roomId, token: userToken };
      } catch (error) {
        // HOÀN TÁC: Nếu lỗi Stream, đẩy đối thủ vào lại hàng chờ (score = 0 để họ vẫn được ưu tiên)
        await this.redis.zadd(queueKey, 0, opponentId);
        throw new InternalServerErrorException('Lỗi khởi tạo phòng phỏng vấn');
        console.log(error);
      }
    }

    // Nếu không tìm được ai, ghi danh vào hàng chờ
    await this.redis.zadd(queueKey, Date.now(), sUserId);
    return { status: 'in_queue', message: 'Đang tìm đối thủ phù hợp...' };
  }

  async handleLeaveQueue(userId: number, level: string) {
    const queueKey = `queue:${level.toUpperCase()}`;
    await this.redis.zrem(queueKey, userId.toString());
    return { status: 'left' };
  }
}
