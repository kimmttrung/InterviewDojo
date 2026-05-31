import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { BullModule } from '@nestjs/bullmq';
import { SessionProcessor } from './processors/session.processor';
import { StreamModule } from '../stream/stream.module';
import { MentorPayoutModule } from '../mentor-payout/mentor-payout.module';
@Module({
  imports: [
    PrismaModule,
    SocketModule,
    BullModule.registerQueue({ name: 'session' }),
    StreamModule,
    MentorPayoutModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionProcessor],
  exports: [SessionService],
})
export class SessionModule {}
