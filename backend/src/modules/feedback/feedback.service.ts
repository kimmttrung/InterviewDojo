// modules/feedback/feedback.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Messages } from '../../common/constants/messages.constant';
import { FeedbackStatus } from '@prisma/client';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import {
  FeedbackResponse,
  PartnerFeedbackResponse,
} from './interfaces/feedback.interface';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async submitFeedback(
    sessionId: number,
    reviewerId: number,
    dto: SubmitFeedbackDto,
  ): Promise<FeedbackResponse> {
    // 1. Kiểm tra session
    const session = await this.prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: {
        match: { include: { candidateA: true, candidateB: true } },
        booking: { include: { mentor: true, candidate: true } },
      },
    });
    if (!session)
      throw new NotFoundException(Messages.FEEDBACK.SESSION_NOT_FOUND);

    // 2. Xác định revieweeId
    let revieweeId: number | null = null;
    if (session.match) {
      if (session.match.candidateAId === reviewerId)
        revieweeId = session.match.candidateBId;
      else if (session.match.candidateBId === reviewerId)
        revieweeId = session.match.candidateAId;
      else throw new ForbiddenException(Messages.FEEDBACK.NOT_PARTICIPANT);
    } else if (session.booking) {
      if (session.booking.mentorId === reviewerId)
        revieweeId = session.booking.candidateId;
      else if (session.booking.candidateId === reviewerId)
        revieweeId = session.booking.mentorId;
      else throw new ForbiddenException(Messages.FEEDBACK.NOT_PARTICIPANT);
    } else {
      throw new BadRequestException('Solo session không hỗ trợ feedback');
    }
    if (!revieweeId)
      throw new ForbiddenException(Messages.FEEDBACK.NOT_PARTICIPANT);

    // 3. Kiểm tra đã feedback chưa
    const existing = await this.prisma.feedback.findFirst({
      where: { sessionId, reviewerId, revieweeId },
    });
    if (existing && existing.status !== FeedbackStatus.PENDING) {
      throw new BadRequestException(Messages.FEEDBACK.ALREADY_SUBMITTED);
    }

    // 4. Validate nội dung
    const hasContent =
      dto.strengths || dto.weaknesses || dto.suggestions || dto.comment;
    if (!hasContent) {
      throw new BadRequestException(Messages.FEEDBACK.MISSING_REQUIRED_FIELDS);
    }

    // 5. Xử lý deadline & status
    const now = new Date();
    let deadline: Date;
    if (existing) {
      deadline = existing.deadline;
    } else {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + 3); // +3 ngày
    }
    const isLate = now > deadline;
    const status = isLate ? FeedbackStatus.LATE : FeedbackStatus.SUBMITTED;

    // 6. Chuẩn bị data – chỉ set field khi có giá trị (tránh lỗi kiểu Json)
    const updateData: any = {
      overallScore: dto.overallScore,
      comment: dto.comment,
      quickTags: dto.quickTags ?? [],
      submittedAt: now,
      status,
    };
    if (dto.strengths !== undefined) updateData.strengths = dto.strengths;
    if (dto.weaknesses !== undefined) updateData.weaknesses = dto.weaknesses;
    if (dto.suggestions !== undefined) updateData.suggestions = dto.suggestions;

    const createData: any = {
      sessionId,
      reviewerId,
      revieweeId,
      overallScore: dto.overallScore,
      comment: dto.comment,
      quickTags: dto.quickTags ?? [],
      deadline,
      submittedAt: now,
      status,
    };
    if (dto.strengths !== undefined) createData.strengths = dto.strengths;
    if (dto.weaknesses !== undefined) createData.weaknesses = dto.weaknesses;
    if (dto.suggestions !== undefined) createData.suggestions = dto.suggestions;

    // 7. Upsert
    let feedback;
    if (existing) {
      feedback = await this.prisma.feedback.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      feedback = await this.prisma.feedback.create({
        data: createData,
      });
    }

    return this.mapToResponse(feedback);
  }

  async getMyFeedback(
    sessionId: number,
    reviewerId: number,
  ): Promise<FeedbackResponse | null> {
    const feedback = await this.prisma.feedback.findFirst({
      where: { sessionId, reviewerId },
    });
    if (!feedback) return null;
    return this.mapToResponse(feedback);
  }

  async getPartnerFeedback(
    sessionId: number,
    userId: number,
  ): Promise<PartnerFeedbackResponse | null> {
    const feedback = await this.prisma.feedback.findFirst({
      where: {
        sessionId,
        revieweeId: userId,
        status: { not: FeedbackStatus.PENDING },
      },
    });
    if (!feedback) return null;
    return {
      overallScore: feedback.overallScore,
      comment: feedback.comment,
      quickTags: feedback.quickTags,
      strengths: feedback.strengths as any,
      weaknesses: feedback.weaknesses as any,
      suggestions: feedback.suggestions as any,
    };
  }

  private mapToResponse(feedback: any): FeedbackResponse {
    return {
      id: feedback.id,
      sessionId: feedback.sessionId,
      reviewerId: feedback.reviewerId,
      revieweeId: feedback.revieweeId,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
      overallScore: feedback.overallScore,
      comment: feedback.comment,
      quickTags: feedback.quickTags,
      submittedAt: feedback.submittedAt,
      deadline: feedback.deadline,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  }

  async getMyReceivedFeedbacks(userId: number) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        revieweeId: userId,
        status: { not: FeedbackStatus.PENDING }, // chỉ lấy đã gửi
      },
      include: {
        session: {
          select: {
            id: true,
            scheduledAt: true,
            source: true,
            match: {
              select: {
                candidateA: { select: { name: true, avatarUrl: true } },
                candidateB: { select: { name: true, avatarUrl: true } },
              },
            },
            booking: {
              select: {
                mentor: { select: { name: true, avatarUrl: true } },
                candidate: { select: { name: true, avatarUrl: true } },
              },
            },
          },
        },
        reviewer: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks.map((fb) => ({
      id: fb.id,
      sessionId: fb.sessionId,
      sessionType: fb.session.source,
      reviewerName: fb.reviewer?.name || 'Unknown',
      reviewerAvatar: fb.reviewer?.avatarUrl,
      overallScore: fb.overallScore,
      comment: fb.comment,
      quickTags: fb.quickTags,
      strengths: fb.strengths,
      weaknesses: fb.weaknesses,
      suggestions: fb.suggestions,
      createdAt: fb.createdAt,
    }));
  }
}
