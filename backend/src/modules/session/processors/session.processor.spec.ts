import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';
import { SessionProcessor } from './session.processor';
import { Job } from 'bullmq';

describe('SessionProcessor', () => {
  let processor: SessionProcessor;
  let prisma: { mockSession: { update: jest.Mock } };
  let socketService: { emitToUser: jest.Mock };
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = { mockSession: { update: jest.fn() } };
    socketService = { emitToUser: jest.fn() };

    moduleRef = await Test.createTestingModule({
      providers: [
        SessionProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
      ],
    }).compile();

    processor = moduleRef.get(SessionProcessor);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (moduleRef) await moduleRef.close();
  });

  it('completes a session and notifies every participant', async () => {
    prisma.mockSession.update.mockResolvedValue({ id: 3 });

    // Tạo job giả với tên 'end-session'
    const job = {
      name: 'end-session',
      data: { sessionId: 3, userIds: [1, 2] },
    } as Job<{ sessionId: number; userIds: number[] }>;

    await processor.process(job);

    expect(prisma.mockSession.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { status: 'COMPLETED' },
    });
    expect(socketService.emitToUser).toHaveBeenNthCalledWith(
      1,
      1,
      'SESSION_ENDED',
      { sessionId: 3 },
    );
    expect(socketService.emitToUser).toHaveBeenNthCalledWith(
      2,
      2,
      'SESSION_ENDED',
      { sessionId: 3 },
    );
  });
});
