// src/modules/meeting/meeting.module.ts
import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { StreamModule } from '../stream/stream.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [StreamModule, PrismaModule],
  controllers: [MeetingController],
})
export class MeetingModule {}
