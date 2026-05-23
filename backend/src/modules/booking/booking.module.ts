import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [PrismaModule, SocketModule, StreamModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
