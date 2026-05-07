import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AiAgentService } from '../ai-analysis/ai-agent.service';
import { UploadedFileType } from '../../common/types/uploaded-file.type';
import { Messages } from '../../common/constants/messages.constant';

@Injectable()
export class SoloRecordingExternalService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  /**
   * Upload video lên Cloudinary, trả về videoUrl và publicId.
   */
  async uploadVideo(file: UploadedFileType): Promise<{
    videoUrl: string;
    publicId: string;
  }> {
    if (!file) {
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      console.error('Lỗi: Buffer của file video bị trống!');
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }

    const isVideo =
      file.mimetype?.startsWith('video/') ||
      file.mimetype === 'application/octet-stream';

    if (!isVideo) {
      throw new BadRequestException(Messages.SOLO_RECORDING.ERROR_VIDEO_FILE);
    }

    try {
      const uploaded = await this.cloudinaryService.uploadVideo(file);
      return {
        videoUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error details:', error);
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }
  }

  /**
   * Gọi AI phân tích transcript, trả về feedback object.
   */
  async analyzeTranscript(params: {
    transcript: string;
    question?: string;
  }): Promise<{
    overallScore: number;
    strengths: object;
    weaknesses: object;
    suggestions: object;
    comment?: string;
  }> {
    const { transcript, question } = params;

    console.log('=== BẮT ĐẦU CHẤM ĐIỂM AI VỚI TEXT ===');
    console.log('Độ dài text:', transcript.length);

    const feedback = await this.aiAgentService.generateFeedback({
      transcript,
      question,
    });

    return {
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
    };
  }
}
