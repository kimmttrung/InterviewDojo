import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { JinaModule } from '../../infrastructure/jina/jina.module';
import { EmbeddingService } from './services/embedding.service';
import { FeatureBuilderService } from './services/feature-builder.service';

@Module({
  imports: [PrismaModule, JinaModule],
  providers: [EmbeddingService, FeatureBuilderService],
  exports: [EmbeddingService],
})
export class RecommendationModule {}
