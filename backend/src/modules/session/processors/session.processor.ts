import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SocketService } from '../../socket/socket.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { MentorPayoutService } from '../../mentor-payout/mentor-payout.service';

interface SessionJobData {
  sessionId: number;
  userIds: number[];
  meetingLink?: string;
}

@Processor('session') // tên queue
export class SessionProcessor extends WorkerHost {
  constructor(
    private socketService: SocketService,
    private prisma: PrismaService,
    private mentorPayoutService: MentorPayoutService,
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
          title: 'Phỏng vấn đã bắt đầu',
          message: 'Nhấn vào đây để tham gia cuộc họp.',
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
    await this.mentorPayoutService.payoutCompletedSessionSafely(sessionId);

    for (const userId of userIds) {
      this.socketService.emitToUser(userId, 'SESSION_ENDED', { sessionId });
    }
  }
}
