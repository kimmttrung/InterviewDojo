// src/modules/mentor-recommendation/jobs/embedding.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '@/prisma/prisma.service';
import { FeatureBuilderService } from '../services/feature-builder.service';
import { JinaService } from '@/infrastructure/jina/jina.service';
import { AiService } from '@/modules/ai-summary/ai-summary.service';

@Processor('embedding-queue')
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureBuilder: FeatureBuilderService,
    private readonly jina: JinaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  /**
   * Hàm core bắt buộc của WorkerHost, tự động định tuyến xử lý dựa trên tên của Job
   */
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `⚙️ [Worker] Đang bốc Job xử lý ngầm: ${job.name} (ID: ${job.id})`,
    );

    // BẮT BUỘC KIỂM TRA: In dữ liệu thô nhận được từ Redis lên màn hình
    this.logger.log(
      `🔍 [Data Check] Dữ liệu thô trong job.data: ${JSON.stringify(job.data)}`,
    );

    try {
      switch (job.name) {
        case 'process-candidate': {
          const { candidateId } = job.data;

          // Kiểm tra xem ID có bị undefined hoặc null không
          if (!candidateId) {
            this.logger.error(
              `❌ [Lỗi cấu trúc] Không tìm thấy candidateId trong job.data! Trận chiến kết thúc sớm.`,
            );
            return;
          }

          await this.handleCandidateEmbedding(candidateId);
          break;
        }

        case 'process-mentor': {
          const { mentorId } = job.data;

          if (!mentorId) {
            this.logger.error(
              `❌ [Lỗi cấu trúc] Không tìm thấy mentorId trong job.data!`,
            );
            return;
          }

          await this.handleMentorEmbedding(mentorId);
          break;
        }

        default:
          this.logger.warn(
            `⚠️ [Worker] Không tìm thấy hàm xử lý cho loại job: ${job.name}`,
          );
      }
    } catch (globalError) {
      this.logger.error(
        `❌ [Global Worker Error] Phát hiện lỗi sập luồng tại hàm process:`,
        globalError.stack || globalError,
      );
      throw globalError;
    }
  }

  private async handleCandidateEmbedding(candidateId: number): Promise<void> {
    try {
      this.logger.log(
        `🔄 [Worker Debug] Bắt đầu build text cho Candidate ${candidateId}`,
      );
      const semanticText =
        await this.featureBuilder.buildCandidateText(candidateId);

      this.logger.log(
        `🔄 [Worker Debug] Nội dung văn bản sinh ra: "${semanticText.substring(0, 100)}..."`,
      );
      this.logger.log(
        `🔄 [Worker Debug] Bắt đầu gọi Jina AI tính toán Vector...`,
      );
      const embedding = await this.jina.embedding(semanticText);

      this.logger.log(
        `🔄 [Worker Debug] Đang ghi đè dữ liệu Vector xuống database bằng SQL thuần...`,
      );

      // Chuyển mảng số thực [0.012, -0.023, ...] thành chuỗi định dạng "[0.012,-0.023,...]" để Postgres nhận diện
      const vectorString = `[${embedding.join(',')}]`;

      // Sử dụng $executeRaw để gán dữ liệu vào cột Unsupported("vector") của bảng users
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
      this.logger.log(`🔄 [Worker Debug] Bắt đầu xử lý Mentor ${mentorId}`);
      const mentor = await this.prisma.user.findUnique({
        where: { id: mentorId },
        select: { bio: true },
      });

      const rawBioText = mentor?.bio ?? '';

      this.logger.log(`🔄 [Worker Debug] Đang rút gọn Bio bằng AI...`);
      const optimizedBioText =
        await this.aiService.summarizeMentorBio(rawBioText);

      const semanticText = await this.featureBuilder.buildMentorText(
        mentorId,
        optimizedBioText,
      );

      this.logger.log(
        `🔄 [Worker Debug] Bắt đầu gọi Jina AI tính toán Vector...`,
      );
      const embedding = await this.jina.embedding(semanticText);

      this.logger.log(
        `🔄 [Worker Debug] Đang ghi đè dữ liệu Vector xuống database bằng SQL thuần...`,
      );

      // Định dạng mảng số thực thành dạng chuỗi vector chuẩn của Postgres
      const vectorString = `[${embedding.join(',')}]`;

      // Sử dụng $executeRaw để gán dữ liệu vào cột Unsupported("vector") của bảng users
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
