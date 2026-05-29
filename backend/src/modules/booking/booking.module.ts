import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [PrismaModule, SocketModule, SessionModule, StreamModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
