import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { SocketService } from '../../socket/socket.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor('session')
export class SessionProcessor {
  constructor(
    private socketService: SocketService,
    private prisma: PrismaService,
  ) {}

  @Process('end-session')
  async handleSessionEnd(job: Job<{ sessionId: number; userIds: number[] }>) {
    const { sessionId, userIds } = job.data;
    // Cập nhật status trong DB
    await this.prisma.mockSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });
    // Emit socket cho cả hai bên
    userIds.forEach((userId) => {
      this.socketService.emitToUser(userId, 'SESSION_ENDED', { sessionId });
    });
  }
}
