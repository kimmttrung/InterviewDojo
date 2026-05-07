import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionMode, SessionStatus } from '@prisma/client';

@Injectable()
export class SoloRecordingDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới một MockSession (mode SOLO) kèm SoloSession con.
   */
  async createSoloSession(params: {
    userId: number;
    durationMinutes: number;
    scheduledAt?: Date;
    recordingUrl?: string;
  }) {
    const { userId, durationMinutes, scheduledAt, recordingUrl } = params;

    // Tách 2 bước để tránh conflict giữa BookingCreateInput và BookingUncheckedCreateInput.
    // Prisma không cho phép vừa dùng nested relation (slot: { create }) vừa dùng raw FK (candidateId)
    // trong cùng một lệnh create.
    const now = scheduledAt ?? new Date();

    const slot = await this.prisma.slot.create({
      data: {
        mentorId: userId, // self-slot cho solo session
        startTime: now,
        endTime: new Date(now.getTime() + durationMinutes * 60000),
      },
    });

    const booking = await this.prisma.booking.create({
      data: {
        slotId: slot.id,
        candidateId: userId,
      },
    });

    const mockSession = await this.prisma.mockSession.create({
      data: {
        bookingId: booking.id,
        intervieweeId: userId,
        scheduledAt: now,
        durationMinutes,
        status: SessionStatus.COMPLETED,
        mode: SessionMode.SOLO,
        recordingUrl: recordingUrl ?? null,
        soloSession: {
          create: {},
        },
      },
      include: { soloSession: true },
    });

    return { booking, mockSession };
  }

  /**
   * Lưu kết quả phân tích AI dưới dạng Feedback gắn vào MockSession.
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
        // reviewerId null → AI-generated feedback
      },
    });
  }

  /**
   * Cập nhật recordingUrl & publicId cho MockSession sau khi upload Cloudinary xong.
   */
  async updateRecordingUrl(
    sessionId: number,
    recordingUrl: string,
    publicId: string,
  ) {
    // publicId lưu vào script của SoloSession để không làm bẩn schema chính.
    return this.prisma.mockSession.update({
      where: { id: sessionId },
      data: {
        recordingUrl,
        soloSession: {
          update: {
            script: { publicId },
          },
        },
      },
      include: { soloSession: true },
    });
  }

  /**
   * Lấy toàn bộ lịch sử solo session của một user, kèm feedback AI.
   */
  async findByUser(userId: number) {
    return this.prisma.mockSession.findMany({
      where: {
        intervieweeId: userId,
        mode: SessionMode.SOLO,
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        soloSession: true,
        feedbacks: true,
      },
    });
  }
}
