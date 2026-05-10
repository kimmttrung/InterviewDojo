import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  SessionMode,
  SessionSource,
  SessionStatus,
} from '@prisma/client';

@Injectable()
export class SoloRecordingDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo SOLO MockSession.
   *
   * SOLO mode:
   * - Không dùng booking
   * - Không dùng match
   * - Lưu transcript/question vào solo_sessions.script
   */
  async createSoloSession(params: {
    userId: number;
    durationMinutes: number;

    question: string;
    answer: string;

    scheduledAt?: Date;
    recordingUrl?: string;
    publicId?: string;
  }) {
    const {
      userId,
      durationMinutes,
      question,
      answer,
      scheduledAt,
      recordingUrl,
      publicId,
    } = params;

    const now = scheduledAt ?? new Date();

    /**
     * Script structure:
     * Có thể mở rộng sau này cho multi-turn conversation.
     */
    const script: Prisma.InputJsonValue = {
      conversations: [
        {
          question,
          answer,
          createdAt: now.toISOString(),
        },
      ],
    };

    const mockSession = await this.prisma.mockSession.create({
      data: {
        intervieweeId: userId,

        scheduledAt: now,
        durationMinutes: durationMinutes,

        status: SessionStatus.COMPLETED,

        source: SessionSource.SOLO,
        mode: SessionMode.SOLO,

        /**
         * URL video cloudinary
         */
        recordingUrl: recordingUrl ?? null,

        /**
         * publicId cloudinary
         * dùng tạm meetingLink để tránh sửa schema
         */
        meetingLink: publicId ?? null,

        /**
         * SOLO detail
         */
        soloSession: {
          create: {
            script,
          },
        },
      },

      include: {
        soloSession: true,
      },
    });

    return mockSession;
  }

  /**
   * Lưu feedback AI cho session.
   */
  async saveFeedback(params: {
    sessionId: number;
    revieweeId: number;
    overallScore: number;
    strengths: object;
    weaknesses: object;
    suggestions: object;
    comment?: string;
  }) {
    const {
      sessionId,
      revieweeId,
      overallScore,
      strengths,
      weaknesses,
      suggestions,
      comment,
    } = params;

    return this.prisma.feedback.create({
      data: {
        sessionId,
        revieweeId,

        overallScore,

        strengths,
        weaknesses,
        suggestions,

        comment: comment ?? null,

        /**
         * reviewerId null = AI feedback
         */
      },
    });
  }

  /**
   * Update recording URL sau khi upload cloudinary xong.
   *
   * recordingUrl:
   * - URL xem video
   *
   * meetingLink:
   * - dùng lưu publicId cloudinary
   */
  async updateRecordingUrl(
    sessionId: number,
    recordingUrl: string,
    publicId: string,
  ) {
    return this.prisma.mockSession.update({
      where: {
        id: sessionId,
      },

      data: {
        recordingUrl,

        /**
         * Dùng meetingLink để lưu publicId
         */
        meetingLink: publicId,
      },

      include: {
        soloSession: true,
      },
    });
  }

  /**
   * Append thêm hội thoại mới vào script JSON.
   *
   * Chuẩn bị cho future continuous conversation.
   */
  async appendConversation(params: {
    sessionId: number;
    question: string;
    answer: string;
  }) {
    const { sessionId, question, answer } = params;

    const current = await this.prisma.soloSession.findFirst({
      where: {
        sessionId,
      },
    });

    const currentScript =
      (current?.script as {
        conversations?: Array<{
          question: string;
          answer: string;
          createdAt: string;
        }>;
      }) ?? {};

    const conversations = currentScript.conversations ?? [];

    conversations.push({
      question,
      answer,
      createdAt: new Date().toISOString(),
    });

    return this.prisma.soloSession.update({
      where: {
        sessionId,
      },

      data: {
        script: {
          conversations,
        },
      },
    });
  }

  /**
   * Lấy lịch sử SOLO session của user.
   */
  async findByUser(userId: number) {
    return this.prisma.mockSession.findMany({
      where: {
        intervieweeId: userId,
        mode: SessionMode.SOLO,
      },

      orderBy: {
        scheduledAt: 'desc',
      },

      include: {
        soloSession: true,
        feedbacks: true,
      },
    });
  }

  /**
   * Lấy chi tiết một SOLO session.
   */
  async findOne(sessionId: number) {
    return this.prisma.mockSession.findUnique({
      where: {
        id: sessionId,
      },

      include: {
        soloSession: true,
        feedbacks: true,
      },
    });
  }
}
