/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { SocketService } from '../socket/socket.service';
import { StreamService } from '../stream/stream.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import Redis from 'ioredis';
import { InternalServerErrorException } from '@nestjs/common';

// Mock module uuid để trả về 1 ID cố định khi test, giúp so sánh dễ dàng hơn
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-room-id'),
}));

describe('MatchingService', () => {
  let service: MatchingService;
  let redis: DeepMocked<Redis>;
  let socketService: DeepMocked<SocketService>;
  let streamService: DeepMocked<StreamService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: 'REDIS_CLIENT',
          useValue: createMock<Redis>(),
        },
        {
          provide: SocketService,
          useValue: createMock<SocketService>(),
        },
        {
          provide: StreamService,
          useValue: createMock<StreamService>(),
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    redis = module.get('REDIS_CLIENT');
    socketService = module.get(SocketService);
    streamService = module.get(StreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleJoinQueue', () => {
    const userId = 1;
    const sUserId = '1';
    const level = 'senior';
    const queueKey = 'queue:SENIOR';

    it('nên thêm user vào hàng chờ nếu không có đối thủ', async () => {
      // Giả lập Redis zrange trả về mảng rỗng (không có ai đang đợi)
      redis.zrange.mockResolvedValue([]);

      const result = await service.handleJoinQueue(userId, level);

      expect(redis.zadd).toHaveBeenCalledWith(
        queueKey,
        expect.any(Number),
        sUserId,
      );
      expect(result).toEqual({
        status: 'in_queue',
        message: 'Đang tìm đối thủ phù hợp...',
      });
    });

    it('nên thực hiện matching nếu tìm thấy đối thủ hợp lệ', async () => {
      const opponentId = '2';

      // Giả lập Redis tìm thấy đối thủ
      redis.zrange.mockResolvedValue([opponentId]);
      // Giả lập Redis zrem trả về 1 (xóa thành công -> cướp được người)
      redis.zrem.mockResolvedValue(1);
      // Giả lập tạo token thành công
      streamService.createToken.mockReturnValue('mock-token');
      streamService.createCall.mockResolvedValue(undefined as any);

      const result = await service.handleJoinQueue(userId, level);

      // Kiểm tra API Stream được gọi đúng
      expect(streamService.createCall).toHaveBeenCalledWith(
        'mock-room-id',
        sUserId,
      );

      // Kiểm tra bắn Socket cho User hiện tại
      expect(socketService.emitToUser).toHaveBeenCalledWith(
        sUserId,
        'match_found',
        expect.objectContaining({
          roomId: 'mock-room-id',
          role: 'interviewee',
          token: 'mock-token',
          opponentId: parseInt(opponentId),
        }),
      );

      // Kiểm tra bắn Socket cho Đối thủ
      expect(socketService.emitToUser).toHaveBeenCalledWith(
        opponentId,
        'match_found',
        expect.objectContaining({
          roomId: 'mock-room-id',
          role: 'interviewer',
          token: 'mock-token',
          opponentId: userId,
        }),
      );

      expect(result).toEqual({
        status: 'matched',
        roomId: 'mock-room-id',
        token: 'mock-token',
      });
    });

    it('nên tự đưa mình vào hàng chờ nếu có đối thủ nhưng không "chiếm" được (Race Condition)', async () => {
      const opponentId = '2';

      // Tìm thấy đối thủ...
      redis.zrange.mockResolvedValue([opponentId]);
      // ...nhưng khi zrem lại ra 0 (đã có người khác chiếm mất trước 1 mili-giây)
      redis.zrem.mockResolvedValue(0);

      const result = await service.handleJoinQueue(userId, level);

      // Sẽ quay về logic add vào hàng đợi
      expect(redis.zadd).toHaveBeenCalledWith(
        queueKey,
        expect.any(Number),
        sUserId,
      );
      expect(result.status).toBe('in_queue');
    });

    it('nên ném ra lỗi nếu StreamService gặp sự cố', async () => {
      const opponentId = '2';

      redis.zrange.mockResolvedValue([opponentId]);
      redis.zrem.mockResolvedValue(1);
      // Giả lập Stream API (bên thứ 3) bị sập mạng
      streamService.createCall.mockRejectedValue(new Error('Stream down'));

      await expect(service.handleJoinQueue(userId, level)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('handleLeaveQueue', () => {
    it('nên xóa user khỏi hàng chờ Redis', async () => {
      const userId = 123;
      const level = 'junior';

      redis.zrem.mockResolvedValue(1);

      const result = await service.handleLeaveQueue(userId, level);

      expect(redis.zrem).toHaveBeenCalledWith('queue:JUNIOR', '123');
      expect(result).toEqual({ status: 'left' });
    });
  });
});
