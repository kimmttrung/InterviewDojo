// src/modules/mentor-recommendation/services/embedding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @InjectQueue('recommendation-queue') private readonly embeddingQueue: Queue,
  ) {}

  /**
   * Đẩy Candidate vào hàng đợi - Xử lý ngay lập tức (Delay = 0)
   */
  async enqueueCandidate(
    candidateId: number,
    delay: number = 0,
  ): Promise<void> {
    // Sử dụng timestamp ở jobId để không bị dính cơ chế chặn trùng lặp khi user cập nhật liên tục
    const jobId = `candidate-embedding-${candidateId}-${Date.now()}`;

    await this.embeddingQueue.add(
      'process-candidate',
      { candidateId },
      {
        jobId,
        delay: delay,
        removeOnComplete: true,
        removeOnFail: true,
        keepLogs: 5,
      },
    );

    this.logger.log(
      `[BullMQ] Candidate ${candidateId} đã được đẩy vào hàng đợi xử lý ngay.`,
    );
  }

  /**
   * Đẩy Mentor vào hàng đợi - Xử lý ngay lập tức sau khi Admin phê duyệt
   */
  async enqueueMentor(mentorId: number, delay: number = 0): Promise<void> {
    const jobId = `mentor-embedding-${mentorId}-${Date.now()}`;

    await this.embeddingQueue.add(
      'process-mentor',
      { mentorId },
      {
        jobId,
        delay: delay,
        keepLogs: 5,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    this.logger.log(
      `[BullMQ] Mentor ${mentorId} (Đã được duyệt) đã được đẩy vào hàng đợi xử lý ngay.`,
    );
  }
}
