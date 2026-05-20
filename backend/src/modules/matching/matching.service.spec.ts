import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { SocketService } from '../socket/socket.service';
import { StreamService } from '../stream/stream.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import Redis from 'ioredis';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-room-id'),
}));

describe('MatchingService', () => {
  let service: MatchingService;
  let redis: DeepMocked<Redis>;
  let socketService: DeepMocked<SocketService>;
  let streamService: DeepMocked<StreamService>;
  let prisma: DeepMocked<PrismaService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: 'REDIS_CLIENT', useValue: createMock<Redis>() },
        { provide: SocketService, useValue: createMock<SocketService>() },
        { provide: StreamService, useValue: createMock<StreamService>() },
        { provide: PrismaService, useValue: createMock<PrismaService>() },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    redis = module.get('REDIS_CLIENT');
    socketService = module.get(SocketService);
    streamService = module.get(StreamService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleJoinQueue', () => {
    const userId = 1;
    const level = 'senior';
    const queueKey = 'queue:SENIOR';

    it('should add user to queue when no opponent is available', async () => {
      redis.zpopmin.mockResolvedValue([]);

      const result = await service.handleJoinQueue(userId, level);

      expect(redis.zadd).toHaveBeenCalledWith(
        queueKey,
        expect.any(Number),
        '1',
      );
      expect(result).toEqual({
        status: 'in_queue',
        message: 'Đang tìm đối thủ phù hợp...',
      });
    });

    it('should match with a valid opponent', async () => {
      const opponentId = '2';
      redis.zpopmin.mockResolvedValue([opponentId, '123']);
      socketService.isUserOnline.mockReturnValue(true);
      streamService.createToken.mockReturnValue('mock-token');
      streamService.createCall.mockResolvedValue({ id: 'mock-call-id' } as any);

      prisma.match.create.mockResolvedValue({
        id: 100,
        candidateAId: userId,
        candidateBId: parseInt(opponentId),
        status: 'MATCHED',
        strategy: 'RANDOM',
        matchedAt: new Date(),
        createdAt: new Date(),
      } as any);

      prisma.mockSession.create.mockResolvedValue({
        id: 200,
        matchId: 100,
        intervieweeId: userId,
        scheduledAt: new Date(),
        durationMinutes: 60,
        status: 'SCHEDULED',
        source: 'P2P_MATCH',
        mode: 'MEET',
        createdAt: new Date(),
      } as any);

      const result = await service.handleJoinQueue(userId, level);

      expect(streamService.createCall).toHaveBeenCalledWith(
        'mock-room-id',
        '1',
      );
      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          candidateAId: 1,
          candidateBId: 2,
          status: 'MATCHED',
          strategy: 'RANDOM',
          matchedAt: expect.any(Date),
        },
      });
      expect(prisma.mockSession.create).toHaveBeenCalledWith({
        data: {
          matchId: 100,
          intervieweeId: 1,
          scheduledAt: expect.any(Date),
          durationMinutes: 60,
          status: 'SCHEDULED',
          source: 'P2P_MATCH',
          mode: 'MEET',
        },
      });
      expect(result.status).toBe('matched');
    });

    it('should throw InternalServerErrorException when StreamService fails', async () => {
      const opponentId = '2';
      redis.zpopmin.mockResolvedValue([opponentId, '123']);
      socketService.isUserOnline.mockReturnValue(true);
      streamService.createCall.mockRejectedValue(new Error('Stream down'));

      await expect(service.handleJoinQueue(userId, level)).rejects.toThrow(
        InternalServerErrorException,
      );

      // Phải đẩy lại opponent vào queue với score 0
      expect(redis.zadd).toHaveBeenCalledWith(queueKey, 0, opponentId);
    });
  });

  describe('handleLeaveQueue', () => {
    it('should remove user from Redis queue', async () => {
      const userId = 123;
      const level = 'junior';
      redis.zrem.mockResolvedValue(1);

      const result = await service.handleLeaveQueue(userId, level);

      expect(redis.zrem).toHaveBeenCalledWith('queue:JUNIOR', '123');
      expect(result).toEqual({ status: 'left' });
    });
  });
});
