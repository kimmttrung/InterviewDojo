import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmbeddingService } from './services/embedding.service';

@Injectable()
export class ProfileEmbeddingListener {
  private readonly logger = new Logger(ProfileEmbeddingListener.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  @OnEvent('user.profile.updated')
  async handleProfileUpdated(payload: { userId: number; role: string }) {
    this.logger.log(
      `🔔 [Event Bus] Đã bắt được sự kiện cập nhật profile của User ID: ${payload.userId}`,
    );

    if (payload.role === 'MENTOR') {
      await this.embeddingService.enqueueMentor(payload.userId);
    } else if (payload.role === 'CANDIDATE') {
      await this.embeddingService.enqueueCandidate(payload.userId);
    }
  }
}
