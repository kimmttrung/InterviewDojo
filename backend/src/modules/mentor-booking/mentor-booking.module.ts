import { Module } from '@nestjs/common';
import { MentorBookingController } from './mentor-booking.controller';
import { MentorBookingService } from './mentor-booking.service';

@Module({
  controllers: [MentorBookingController],
  providers: [MentorBookingService],
})
export class MentorBookingModule {}
