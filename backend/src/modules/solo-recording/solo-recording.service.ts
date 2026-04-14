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
      recordingId: recording.id,
      fileUrl: uploaded.secure_url,
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
}
