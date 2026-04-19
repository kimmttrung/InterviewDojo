import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { SoloRecordingModule } from './modules/solo-recording/solo-recording.module';
import { TargetRoleModule } from './modules/target-role/target-role.module';
import { CodingModule } from './modules/coding/coding.module';
import { BullModule } from '@nestjs/bullmq';
import { bullConfig } from './config/bull.config';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // setup BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: bullConfig,
    }),

    // đăng ký queue sẽ dùng
    BullModule.registerQueue(
      { name: 'code-execution' }, // cho submit code
      { name: 'ai-analysis' }, // cho AI phân tích
      { name: 'notification' }, // cho gửi thông báo sau này
      { name: 'email' }, // cho gửi email
    ),

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
    SoloRecordingModule,
    TargetRoleModule,
    CodingModule,
    CategoriesModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor, // NestJS tự inject Reflector
    },
  ],
})
export class AppModule {}
