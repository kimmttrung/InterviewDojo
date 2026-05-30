import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SocketService } from '../../socket/socket.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface SessionJobData {
  sessionId: number;
  userIds: number[];
  meetingLink?: string;
}

@Processor('session')
export class SessionProcessor extends WorkerHost {
  constructor(
    private socketService: SocketService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<SessionJobData>) {
    const { sessionId, userIds } = job.data;
    if (job.name === 'start-session-notification' && job.data.meetingLink) {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: NotificationType.INTERVIEW_UPCOMING,
          title: 'Interview has started',
          message: 'Click here to join the meeting.',
          targetUrl: '/sessions/',
        })),
      });

      for (const userId of userIds) {
        this.socketService.emitToUser(userId, 'NOTIFICATION_CREATED', {
          sessionId,
        });
      }
      return;
    }
    console.log(`✅ Processing end-session for session ${sessionId}`);

    await this.prisma.mockSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    for (const userId of userIds) {
      this.socketService.emitToUser(userId, 'SESSION_ENDED', { sessionId });
    }
  }
}
