// src/modules/mentor-recommendation/jobs/embedding.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '@/prisma/prisma.service';
import { FeatureBuilderService } from '../services/feature-builder.service';
import { JinaService } from '@/infrastructure/jina/jina.service';
import { AiService } from '@/modules/ai-summary/ai-summary.service';
import { RecommendationService } from '../recommendation.service';

@Processor('recommendation-queue')
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureBuilder: FeatureBuilderService,
    private readonly jina: JinaService,
    private readonly aiService: AiService,
    private readonly recommendationService: RecommendationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `⚙️ [Worker] Đang bốc Job xử lý ngầm: ${job.name} (ID: ${job.id})`,
    );

    try {
      switch (job.name) {
        case 'process-candidate': {
          const { candidateId } = job.data;
          if (!candidateId) return;

          await this.handleCandidateEmbedding(candidateId);

          this.logger.log(
            `🔄 [Cache Pipeline] Tính toán trước bảng điểm gợi ý cho Candidate ${candidateId}...`,
          );
          await this.recommendationService.calculateAndCacheRecommendations(
            candidateId,
          );
          break;
        }

        case 'process-mentor': {
          const { mentorId } = job.data;
          if (!mentorId) return;

          await this.handleMentorEmbedding(mentorId);
          break;
        }
      }
    } catch (globalError) {
      this.logger.error(
        `❌ [Global Worker Error] Thất bại tại hàm process:`,
        globalError.stack || globalError,
      );
      throw globalError;
    }
  }

  private async handleCandidateEmbedding(candidateId: number): Promise<void> {
    try {
      const semanticText =
        await this.featureBuilder.buildCandidateText(candidateId);
      const embedding = await this.jina.embedding(semanticText);
      const vectorString = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE users 
        SET embedding_vector = ${vectorString}::vector 
        WHERE id = ${candidateId};
      `;

      this.logger.log(
        `✅ [Worker] Hoàn thành tính Vector Embedding cho Candidate ${candidateId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [Worker LỖI] Thất bại tại Candidate ${candidateId}:`,
        error.stack || error,
      );
      throw error;
    }
  }

  private async handleMentorEmbedding(mentorId: number): Promise<void> {
    try {
      const mentor = await this.prisma.user.findUnique({
        where: { id: mentorId },
        select: { bio: true },
      });

      const rawBioText = mentor?.bio ?? '';
      const optimizedBioText =
        await this.aiService.summarizeMentorBio(rawBioText);
      const semanticText = await this.featureBuilder.buildMentorText(
        mentorId,
        optimizedBioText,
      );

      const embedding = await this.jina.embedding(semanticText);
      const vectorString = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE users 
        SET embedding_vector = ${vectorString}::vector 
        WHERE id = ${mentorId};
      `;

      this.logger.log(
        `✅ [Worker] Hoàn thành tính Vector Embedding cho Mentor ${mentorId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [Worker LỖI] Thất bại tại Mentor ${mentorId}:`,
        error.stack || error,
      );
      throw error;
    }
  }
}
