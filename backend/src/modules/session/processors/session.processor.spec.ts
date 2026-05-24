import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';
import { SessionProcessor } from './session.processor';

describe('SessionProcessor', () => {
  let processor: SessionProcessor;
  const prisma = { mockSession: { update: jest.fn() } };
  const socketService = { emitToUser: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socketService },
      ],
    }).compile();
    processor = moduleRef.get(SessionProcessor);
    jest.clearAllMocks();
  });

  it('completes a session and notifies every participant', async () => {
    prisma.mockSession.update.mockResolvedValue({ id: 3 });

    await processor.handleSessionEnd({
      data: { sessionId: 3, userIds: [1, 2] },
    } as any);

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
