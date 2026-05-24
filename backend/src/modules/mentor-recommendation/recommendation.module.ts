import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { EmbeddingService } from './services/embedding.service';
import { FeatureBuilderService } from './services/feature-builder.service';
import { ProfileEmbeddingListener } from './profile-embedding.listener';
import { EmbeddingProcessor } from './jobs/embedding.processor';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { JinaModule } from '../../infrastructure/jina/jina.module';
import { AiModule } from '../ai-summary/ai-summary.module';

import { HardFilterService } from './services/hard-filter.service';
import { RankingService } from './services/ranking.service';
import { ExperienceScoreService } from './services/experience-score.service';
import { AvailibilityScoreService } from './services/availability-score.service';
import { TargetRoleScoreService } from './services/target-role-score.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'embedding-queue',
    }),
    PrismaModule,
    JinaModule,
    AiModule,
  ],
  controllers: [RecommendationController],
  providers: [
    EmbeddingService,
    EmbeddingProcessor,
    FeatureBuilderService,
    ProfileEmbeddingListener,
    RecommendationService,

    HardFilterService,
    RankingService,
    ExperienceScoreService,
    AvailibilityScoreService,
    TargetRoleScoreService,
  ],
  exports: [RecommendationService],
})
export class MentorRecommendationModule {}
