import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { UploadedFileType } from '../../common/types/uploaded-file.type';
import { Messages } from '../../common/constants/messages.constant';
@Injectable()
export class SoloRecordingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  // Fewer logs version
  async uploadVideo(file: UploadedFileType) {
    // 1. Logic kiểm tra file tồn tại (Giữ nguyên của bạn)
    if (!file) {
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }

    // 2. Bổ sung logic kiểm tra Buffer (Để đảm bảo Multer không gửi xác rỗng)
    if (!file.buffer || file.buffer.length === 0) {
      console.error('Lỗi: Buffer của file video bị trống!');
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }

    // 3. Logic kiểm tra Mimetype (Gia cố để chấp nhận webm/octet-stream)
    const isVideo =
      file.mimetype?.startsWith('video/') ||
      file.mimetype === 'application/octet-stream';

    if (!isVideo) {
      throw new BadRequestException(Messages.SOLO_RECORDING.ERROR_VIDEO_FILE);
    }

    try {
      // 4. Gọi CloudinaryService (Giữ nguyên của bạn)
      const uploaded = await this.cloudinaryService.uploadVideo(file);

      return {
        videoUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      };
    } catch (error) {
      // 5. Logic Catch error (Giữ nguyên của bạn nhưng thêm log chi tiết để debug)
      console.error('Cloudinary upload error details:', error);
      throw new BadRequestException(
        Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
      );
    }
  }
  //Upload audio file for analysis
  async uploadAudioAndAnalyze(dto: CreateSoloRecordingDto) {
    const transcript = dto.transcript?.trim();

    if (!transcript) {
      throw new BadRequestException(
        'Không nhận diện được giọng nói của bạn (Transcript rỗng).',
      );
    }

    console.log('=== BẮT ĐẦU CHẤM ĐIỂM AI VỚI TEXT ===');
    console.log('Độ dài text:', transcript.length);

    // 1. Ném thẳng Text qua AI Groq Llama 3 để chấm điểm (Mất chưa tới 2 giây)
    const feedback = await this.aiAnalysisService.generateFeedback({
      transcript,
      question: dto.question,
    });

    // 2. Lưu vào Database (Không còn trường audioUrl)
    const recording = await this.prisma.soloRecording.create({
      data: {
        userId: Number(dto.userId),
        videoUrl: dto.videoUrl || '',
        publicId: dto.publicId || '',
        duration: dto.duration ? Number(dto.duration) : null,
      },
    });

    // 3. Lưu kết quả AI
    const aiAnalysis = await this.aiAnalysisService.saveSoloRecordingAnalysis({
      soloRecordingId: recording.id,
      transcript,
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
    });

    return {
      recordingId: recording.id,
      videoUrl: recording.videoUrl,
      transcript,
      analysis: feedback,
      analysisId: aiAnalysis.id,
      processedAt: aiAnalysis.processedAt,
    };
  }

  async findByUser(userId: number) {
    return this.prisma.soloRecording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { aiAnalysis: true },
    });
  }

  async updateVideoUrl(
    recordingId: number,
    videoUrl: string,
    publicId: string,
  ) {
    return this.prisma.soloRecording.update({
      where: { id: recordingId },
      data: { videoUrl: videoUrl, publicId: publicId },
    });
  }
}
