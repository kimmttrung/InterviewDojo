import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './modules/questions/questions.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { UserModule } from './modules/user/user.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { StreamModule } from './modules/stream/stream.module';
import { SocketModule } from './modules/socket/socket.module';
import { MatchingModule } from './modules/matching/matching.module';
import { CodeEngineModule } from './modules/code-engine/code-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    QuestionsModule,
    AuthModule,
    RedisModule,
    UserModule,
    CloudinaryModule,
    StreamModule,
    SocketModule,
    MatchingModule,
    CodeEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
