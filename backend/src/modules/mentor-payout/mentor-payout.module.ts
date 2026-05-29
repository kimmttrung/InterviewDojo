import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import {
  AdminPayoutRetryController,
  MentorPayoutController,
} from './mentor-payout.controller';
import { MentorPayoutService } from './mentor-payout.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MentorPayoutController, AdminPayoutRetryController],
  providers: [MentorPayoutService],
  exports: [MentorPayoutService],
})
export class MentorPayoutModule {}
