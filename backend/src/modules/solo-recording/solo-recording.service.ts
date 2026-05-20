import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';
import { UploadedFileType } from '../../common/types/uploaded-file.type';
import { SoloRecordingDatabaseService } from './solo-recording-database.service';
import { SoloRecordingExternalService } from './solo-recording-external.service';

@Injectable()
export class SoloRecordingService {
  constructor(
    private readonly dbService: SoloRecordingDatabaseService,
    private readonly externalService: SoloRecordingExternalService,
  ) {}

  /**
   * Upload video lên Cloudinary.
   */
  async uploadVideo(file: UploadedFileType) {
    console.log('=== SERVICE upload-video CALLED ===');

    return this.externalService.uploadVideo(file);
  }

  /**
   * Phân tích transcript + lưu SOLO session.
   */
  async uploadAudioAndAnalyze(dto: CreateSoloRecordingDto) {
    const transcript = dto.transcript?.trim();

    if (!transcript) {
      throw new BadRequestException(
        'Không nhận diện được giọng nói của bạn (Transcript rỗng).',
      );
    }

    /**
     * Parse dữ liệu đầu vào
     */
    const userId = Number(dto.userId);

    const duration = Number(dto.duration);

    const question = dto.question?.trim() || 'Unknown question';

    /**
     * 1. AI analyze
     */
    const feedback = await this.externalService.analyzeTranscript({
      transcript,
      question,
    });

    /**
     * 2. Tạo SOLO mock session
     */
    const mockSession = await this.dbService.createSoloSession({
      userId,

      durationMinutes: duration,

      question,

      answer: transcript,

      /**
       * Upload video riêng nên lúc này chưa có
       */
      recordingUrl: undefined,

      /**
       * publicId cloudinary
       */
      publicId: undefined,
    });

    /**
     * 3. Save feedback
     */
    const savedFeedback = await this.dbService.saveFeedback({
      sessionId: mockSession.id,

      revieweeId: userId,

      overallScore: feedback.overallScore,

      strengths: feedback.strengths,

      weaknesses: feedback.weaknesses,

      suggestions: feedback.suggestions,

      /**
       * Lưu transcript vào comment
       */
      comment: transcript,
    });

    return {
      sessionId: mockSession.id,

      transcript,

      analysis: feedback,

      feedbackId: savedFeedback.id,

      processedAt: savedFeedback.createdAt,
    };
  }

  /**
   * Lấy lịch sử SOLO session.
   */
  async findByUser(userId: number) {
    return this.dbService.findByUser(userId);
  }

  /**
   * Update URL video sau khi upload cloudinary xong.
   */
  async updateVideoUrl(sessionId: number, videoUrl: string, publicId: string) {
    return this.dbService.updateRecordingUrl(sessionId, videoUrl, publicId);
  }
}
