import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter'; // <--- 1. IMPORT EVENT EMITTER
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
import { MentorModule } from './modules/mentor/mentor.module';
import { BookingModule } from './modules/booking/booking.module';
import { PlanModule } from './modules/plan/plan.module';
import { SlotModule } from './modules/slot/slot.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CoachingCategoryModule } from './modules/coaching-category/coaching-category.module';
import { SkillModule } from './modules/skill/skill.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CandidateDashboardModule } from './modules/candidate-dashboard/candidate-dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SessionModule } from './modules/session/session.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { MentorRecommendationModule } from './modules/mentor-recommendation/recommendation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JobRolesModule } from './modules/job-roles/job-roles.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    EventEmitterModule.forRoot(),

    // Setup BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: bullConfig,
    }),

    // Đăng ký toàn bộ queue hệ thống sẽ dùng
    BullModule.registerQueue(
      { name: 'code-execution' }, // cho submit code
      { name: 'code-execution' },
      { name: 'ai-analysis' },
      { name: 'notification' },
      { name: 'email' },
      { name: 'recommendation-queue' },
      { name: 'session' },
    ),

    PrismaModule,
    MentorRecommendationModule,
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
    MentorModule,
    BookingModule,
    PlanModule,
    SlotModule,
    PaymentModule,
    CoachingCategoryModule,
    SkillModule,
    WalletModule,
    FeedbackModule,
    CandidateDashboardModule,
    NotificationsModule,
    SessionModule,
    BookmarkModule,
    MeetingModule,
    AdminModule,
    ReportsModule,
    JobRolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
