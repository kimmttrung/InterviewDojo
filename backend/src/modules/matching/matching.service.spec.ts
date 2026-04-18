// import { Test, TestingModule } from '@nestjs/testing';
// import { MatchingService } from './matching.service';
// import { SocketService } from '../socket/socket.service';
// import { StreamService } from '../stream/stream.service';
// import { createMock, DeepMocked } from '@golevelup/ts-jest';
// import Redis from 'ioredis';
// import { InternalServerErrorException } from '@nestjs/common';
// // import { v4 as uuidv4 } from 'uuid';

// // Mock module uuid để trả về 1 ID cố định khi test
// jest.mock('uuid', () => ({
//   v4: jest.fn(() => 'mock-room-id'),
// }));

// /* eslint-disable @typescript-eslint/unbound-method */
// /* eslint-disable prettier/prettier */

// describe('MatchingService', () => {
//   let service: MatchingService;
//   let redis: DeepMocked<Redis>;
//   let socketService: DeepMocked<SocketService>;
//   let streamService: DeepMocked<StreamService>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         MatchingService,
//         {
//           provide: 'REDIS_CLIENT',
//           useValue: createMock<Redis>(),
//         },
//         {
//           provide: SocketService,
//           useValue: createMock<SocketService>(),
//         },
//         {
//           provide: StreamService,
//           useValue: createMock<StreamService>(),
//         },
//       ],
//     }).compile();

//     service = module.get<MatchingService>(MatchingService);
//     redis = module.get('REDIS_CLIENT');
//     socketService = module.get(SocketService);
//     streamService = module.get(StreamService);
//   });

//   describe('handleJoinQueue', () => {
//     const userId = 1;
//     const sUserId = '1';
//     const level = 'senior';
//     const queueKey = 'queue:SENIOR';

//     it('nên thêm user vào hàng chờ nếu không có đối thủ', async () => {
//       (redis.zrange as unknown as jest.Mock).mockResolvedValue([]);

//       const result = await service.handleJoinQueue(userId, level);

//       expect(redis.zadd).toHaveBeenCalledWith(
//         queueKey,
//         expect.any(Number),
//         sUserId,
//       );
//       expect(result).toEqual({
//         status: 'in_queue',
//         message: 'Đang tìm đối thủ phù hợp...',
//       });
//     });

//     it('nên thực hiện matching nếu tìm thấy đối thủ hợp lệ', async () => {
//       const opponentId = '2';

//       (redis.zrange as unknown as jest.Mock).mockResolvedValue([opponentId]);
//       (redis.zrem as unknown as jest.Mock).mockResolvedValue(1);
//       (streamService.createToken as unknown as jest.Mock).mockReturnValue('mock-token');

//       const result = await service.handleJoinQueue(userId, level);

//       expect(streamService.createCall).toHaveBeenCalledWith(
//         'mock-room-id',
//         sUserId,
//       );

//       expect(socketService.emitToUser).toHaveBeenCalledWith(
//         sUserId,
//         'match_found',
//         expect.objectContaining({
//           roomId: 'mock-room-id',
//           role: 'interviewee',
//         }),
//       );
//       expect(socketService.emitToUser).toHaveBeenCalledWith(
//         opponentId,
//         'match_found',
//         expect.objectContaining({
//           role: 'interviewer',
//           opponentId: userId,
//         }),
//       );

//       expect(result).toEqual({
//         status: 'matched',
//         roomId: 'mock-room-id',
//         token: 'mock-token',
//       });
//     });

//     it('nên tự đưa mình vào hàng chờ nếu có đối thủ nhưng không "chiếm" được (Race Condition)', async () => {
//       const opponentId = '2';

//       (redis.zrange as unknown as jest.Mock).mockResolvedValue([opponentId]);
//       (redis.zrem as unknown as jest.Mock).mockResolvedValue(0);

//       const result = await service.handleJoinQueue(userId, level);

//       expect(redis.zadd).toHaveBeenCalled();
//       expect(result.status).toBe('in_queue');
//     });

//     it('nên ném ra lỗi nếu StreamService gặp sự cố', async () => {
//       const opponentId = '2';

//       (redis.zrange as unknown as jest.Mock).mockResolvedValue([opponentId]);
//       (redis.zrem as unknown as jest.Mock).mockResolvedValue(1);
//       (streamService.createCall as unknown as jest.Mock).mockRejectedValue(
//         new Error('Stream down'),
//       );

//       await expect(service.handleJoinQueue(userId, level)).rejects.toThrow(
//         InternalServerErrorException,
//       );
//     });
//   });

//   describe('handleLeaveQueue', () => {
//     it('nên xóa user khỏi hàng chờ Redis', async () => {
//       const userId = 123;
//       const level = 'junior';

//       const result = await service.handleLeaveQueue(userId, level);

//       expect(redis.zrem).toHaveBeenCalledWith('queue:JUNIOR', '123');
//       expect(result).toEqual({ status: 'left' });
//     });
//   });
// });
