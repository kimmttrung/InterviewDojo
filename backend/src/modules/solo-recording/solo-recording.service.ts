import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

@Injectable()
export class SoloRecordingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  async uploadVideo(file: UploadedFileType, dto: CreateSoloRecordingDto) {
    console.log('--- BẮT ĐẦU UPLOAD VIDEO ---');

    if (!file) {
      throw new BadRequestException('File video là bắt buộc');
    }

    // Gọi hàm uploadVideo thay vì uploadAudio
    const uploaded = await this.cloudinaryService.uploadVideo(file);

    return this.prisma.soloRecording.create({
      data: {
        userId: Number(dto.userId),
        videoUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        duration: dto.duration ? Number(dto.duration) : null,
      },
    });
  }

  async analyzeRecording(params: {
    soloRecordingId: number;
    file: UploadedFileType;
    question?: string;
  }) {
    const { soloRecordingId, file, question } = params;

    // Kiểm tra xem file gửi lên có phải video không
    if (!file) {
      throw new BadRequestException('File video để phân tích là bắt buộc');
    }

    const recording = await this.prisma.soloRecording.findUnique({
      where: { id: soloRecordingId },
    });

    if (!recording) {
      throw new BadRequestException('Không tìm thấy bản ghi');
    }

    // Whisper vẫn có thể trích xuất âm thanh trực tiếp từ file video (.webm/.mp4)
    const transcript =
      await this.aiAnalysisService.transcribeFromVideoFile(file);

    const feedback = await this.aiAnalysisService.generateFeedback({
      transcript,
      question,
    });

    const aiAnalysis = await this.aiAnalysisService.saveSoloRecordingAnalysis({
      soloRecordingId,
      transcript,
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
    });

    return {
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
      include: {
        aiAnalysis: true,
      },
    });
  }
}
