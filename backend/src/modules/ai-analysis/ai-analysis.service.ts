import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async getSessionFeedback(sessionId: number) {
    return this.prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: {
        soloSession: true,
        feedbacks: true,
        questions: {
          include: { question: true },
        },
      },
    });
  }

  async saveSoloSessionFeedback(params: {
    sessionId: number;
    revieweeId: number;
    question?: string;
    transcript: string;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }) {
    const {
      sessionId,
      revieweeId,
      question,
      transcript,
      overallScore,
      strengths,
      weaknesses,
      suggestions,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật lịch sử trả lời vào SoloSession
      await tx.soloSession.upsert({
        where: { sessionId: sessionId },
        update: {
          script: { question, transcript },
        },
        create: {
          sessionId: sessionId,
          script: { question, transcript },
        },
      });

      // 2. Tạo Feedback (không truyền reviewerId -> tự động là null)
      const feedback = await tx.feedback.create({
        data: {
          sessionId: sessionId,
          revieweeId: revieweeId,
          overallScore: overallScore,
          strengths: strengths,
          weaknesses: weaknesses,
          suggestions: suggestions,
          comment: 'AI Generated Feedback',
        },
      });

      // 3. Cập nhật trạng thái session
      await tx.mockSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });

      return feedback;
    });
  }
}
