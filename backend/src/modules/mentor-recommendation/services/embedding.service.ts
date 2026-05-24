import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { FeatureBuilderService } from './feature-builder.service';
import { JinaService } from '@/infrastructure/jina/jina.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,

    private readonly featureBuilder: FeatureBuilderService,

    private readonly jina: JinaService,
  ) {}

  async updateCandidateEmbedding(candidateId: number): Promise<void> {
    const semanticText =
      await this.featureBuilder.buildCandidateText(candidateId);

    const embedding = await this.jina.embedding(semanticText);

    await this.saveEmbedding(candidateId, embedding);

    this.logger.log(`Candidate ${candidateId} embedding updated`);
  }

  async updateMentorEmbedding(mentorId: number): Promise<void> {
    const mentor = await this.prisma.user.findUnique({
      where: { id: mentorId },
      select: { bio: true },
    });

    const bioText = mentor?.bio ?? '';

    // SỬA LỖI: Truyền chính xác mentorId (number) và bioText (string) làm 2 tham số độc lập
    const semanticText = await this.featureBuilder.buildMentorText(
      mentorId,
      bioText,
    );

    const embedding = await this.jina.embedding(semanticText);

    await this.saveEmbedding(mentorId, embedding);

    this.logger.log(`Mentor ${mentorId} embedding updated`);
  }

  private async saveEmbedding(userId: number, embedding: number[]) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        embeddingVector: embedding,
      } as any,
    });
  }
}
