import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { RedisModule } from '../redis/redis.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [RedisModule, SocketModule, StreamModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
