import { Module } from '@nestjs/common';
import { MentorService } from './mentor.service';
import { MentorController } from './mentor.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, BookingModule],
  controllers: [MentorController],
  providers: [MentorService],
  exports: [MentorService],
})
export class MentorModule {}
