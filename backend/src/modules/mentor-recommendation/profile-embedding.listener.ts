// src/modules/mentor-recommendation/listeners/recommendation.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmbeddingService } from './services/embedding.service';

@Injectable()
export class RecommendationListener {
  private readonly logger = new Logger(RecommendationListener.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  // 1. Hồ sơ Candidate thay đổi hoặc Admin duyệt Mentor -> Kích hoạt ngay lập tức
  @OnEvent('user.profile.updated')
  async handleProfile(payload: { userId: number; role: string }) {
    if (payload.role === 'CANDIDATE') {
      this.logger.log(
        `🔔 [Profile Event] Đẩy Candidate ${payload.userId} đi tính toán.`,
      );
      await this.embeddingService.enqueueCandidate(payload.userId);
    } else if (payload.role === 'MENTOR') {
      this.logger.log(
        `🔔 [Approval Event] Đẩy Mentor ${payload.userId} (Đã duyệt) đi tính toán.`,
      );
      await this.embeddingService.enqueueMentor(payload.userId, 5 * 60 * 1000);
    }
  }

  // 2. Candidate hoàn thành Booking lịch hẹn -> Đẩy đi tính lại
  @OnEvent('booking.completed')
  async handleBooking(payload: { candidateId: number }) {
    this.logger.log(
      `🔔 [Booking Event] Đẩy Candidate ${payload.candidateId} đi tính toán lại.`,
    );
    await this.embeddingService.enqueueCandidate(
      payload.candidateId,
      0 * 60 * 1000,
    );
  }

  // 3. Candidate bookmark câu hỏi -> Đẩy đi tính lại
  @OnEvent('user.bookmark.updated')
  async handleBookmark(payload: { candidateId: number }) {
    this.logger.log(
      `🔔 [Bookmark Event] Đẩy Candidate ${payload.candidateId} đi tính toán lại.`,
    );
    await this.embeddingService.enqueueCandidate(
      payload.candidateId,
      60 * 60 * 1000,
    );
  }
}
