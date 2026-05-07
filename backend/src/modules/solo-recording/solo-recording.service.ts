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
   * Bước 1: Upload video lên Cloudinary, trả về videoUrl & publicId.
   */
  async uploadVideo(file: UploadedFileType) {
    console.log('=== SERVICE upload-video CALLED ===');
    return this.externalService.uploadVideo(file);
  }

  /**
   * Bước 2: Nhận transcript, phân tích AI và lưu toàn bộ vào DB.
   */
  async uploadAudioAndAnalyze(dto: CreateSoloRecordingDto) {
    const transcript = dto.transcript?.trim();

    if (!transcript) {
      throw new BadRequestException(
        'Không nhận diện được giọng nói của bạn (Transcript rỗng).',
      );
    }

    // 1. Phân tích transcript qua AI (external)
    const feedback = await this.externalService.analyzeTranscript({
      transcript,
      question: dto.question,
    });

    // 2. Tạo MockSession (SOLO) và SoloSession trong DB
    const { mockSession } = await this.dbService.createSoloSession({
      userId: Number(dto.userId),
      durationMinutes: dto.durationMinutes ?? 0,
      recordingUrl: dto.videoUrl,
    });

    // 3. Lưu kết quả AI vào Feedback
    const savedFeedback = await this.dbService.saveFeedback({
      sessionId: mockSession.id,
      revieweeId: Number(dto.userId),
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
      comment: transcript,
    });

    return {
      sessionId: mockSession.id,
      videoUrl: mockSession.recordingUrl,
      transcript,
      analysis: feedback,
      feedbackId: savedFeedback.id,
      processedAt: savedFeedback.createdAt,
    };
  }

  /**
   * Lấy lịch sử solo session của user.
   */
  async findByUser(userId: number) {
    return this.dbService.findByUser(userId);
  }

  /**
   * Cập nhật videoUrl sau khi client upload Cloudinary xong.
   */
  async updateVideoUrl(sessionId: number, videoUrl: string, publicId: string) {
    return this.dbService.updateRecordingUrl(sessionId, videoUrl, publicId);
  }
}
