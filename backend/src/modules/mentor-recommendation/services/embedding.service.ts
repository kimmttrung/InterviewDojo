import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @InjectQueue('embedding-queue') private readonly embeddingQueue: Queue,
  ) {}

  /**
   * Xếp hàng Candidate chờ tính toán Embedding sau 5 phút
   */
  async enqueueCandidate(candidateId: number): Promise<void> {
    const delayTime = 0 * 60 * 1000; // 5 phút = 300,000 ms
    // const jobId = `candidate-embedding-${candidateId}`;
    const jobId = `candidate-embedding-${candidateId}-${Date.now()}`; // Thêm timestamp để tránh trùng lặp jobId khi cập nhật liên tục

    // Đẩy job vào BullMQ với cấu hình delay và gán jobId cố định để debounce rác
    await this.embeddingQueue.add(
      'process-candidate',
      { candidateId },
      {
        jobId,
        delay: delayTime,
        removeOnComplete: true,
        removeOnFail: true,
        keepLogs: 10,
      },
    );

    this.logger.log(
      `[BullMQ] Candidate ${candidateId} đã được xếp hàng. Sẽ xử lý sau ${delayTime / 60000} phút.`,
    );
  }

  /**
   * Xếp hàng Mentor chờ tính toán Embedding sau 5 phút
   */
  async enqueueMentor(mentorId: number): Promise<void> {
    const delayTime = 0 * 60 * 1000; // 5 phút = 300,000 ms
    const jobId = `mentor-embedding-${mentorId}`;

    await this.embeddingQueue.add(
      'process-mentor',
      { mentorId },
      {
        jobId,
        delay: delayTime,
        keepLogs: 10,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    this.logger.log(
      `[BullMQ] Mentor ${mentorId} đã được xếp hàng. Sẽ xử lý sau ${delayTime / 60000} phút.`,
    );
  }
}
