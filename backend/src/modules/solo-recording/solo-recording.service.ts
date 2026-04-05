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

  async uploadAudio(file: UploadedFileType, dto: CreateSoloRecordingDto) {
    if (!file) {
      throw new BadRequestException('File audio là bắt buộc');
    }

    const uploaded = await this.cloudinaryService.uploadAudio(file);

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

    if (!file) {
      throw new BadRequestException('File audio là bắt buộc');
    }

    const recording = await this.prisma.soloRecording.findUnique({
      where: { id: soloRecordingId },
    });

    if (!recording) {
      throw new BadRequestException('Không tìm thấy solo recording');
    }

    const transcript = await this.aiAnalysisService.transcribeFromFile(file);

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
      analysis: {
        overallScore: feedback.overallScore,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        suggestions: feedback.suggestions,
      },
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
