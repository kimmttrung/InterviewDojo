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
  ) { }

  async uploadAndAnalyze(file: UploadedFileType, dto: CreateSoloRecordingDto) {
    if (!file) {
      throw new BadRequestException('File audio/video là bắt buộc');
    }

    const isAudio = file.mimetype?.startsWith('audio/');
    const uploaded = isAudio
      ? await this.cloudinaryService.uploadAudio(file)
      : await this.cloudinaryService.uploadVideo(file);

    const recording = await this.prisma.soloRecording.create({
      data: {
        userId: Number(dto.userId),
        videoUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        duration: dto.duration ? Number(dto.duration) : null,
      },
    });

    try {
      const transcript = await this.aiAnalysisService.transcribeFromAudioUrl(
        uploaded.secure_url,
      );

      const feedback = await this.aiAnalysisService.generateFeedback({
        transcript,
        question: dto.question,
      });

      const aiAnalysis = await this.aiAnalysisService.saveSoloRecordingAnalysis({
        soloRecordingId: recording.id,
        transcript,
        overallScore: feedback.overallScore,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        suggestions: feedback.suggestions,
      });

      return {
        success: true,
        recordingId: recording.id,
        fileUrl: uploaded.secure_url,
        transcript,
        analysis: feedback,
        analysisId: aiAnalysis.id,
        processedAt: aiAnalysis.processedAt,
      };
    } catch (error) {
      console.error('uploadAndAnalyze error:', error);

      return {
        success: false,
        recordingId: recording.id,
        fileUrl: uploaded.secure_url,
        transcript: '',
        analysis: {
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          suggestions: [],
        },
        error:
          error instanceof Error
            ? error.message
            : 'Không thể phân tích bài nói',
      };
    }
  }

  async findByUser(userId: number) {
    return this.prisma.soloRecording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { aiAnalysis: true },
    });
  }
}
