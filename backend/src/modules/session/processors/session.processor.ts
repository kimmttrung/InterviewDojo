import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SocketService } from '../../socket/socket.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor('session') // tên queue
export class SessionProcessor extends WorkerHost {
  constructor(
    private socketService: SocketService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(
    job: Job<{ sessionId: number; userIds: number[] }>,
  ): Promise<any> {
    if (job.name === 'end-session') {
      const { sessionId, userIds } = job.data;
      await this.prisma.mockSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });
      userIds.forEach((userId) => {
        this.socketService.emitToUser(userId, 'SESSION_ENDED', { sessionId });
      });
    }
  }
}
