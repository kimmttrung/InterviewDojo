// src/modules/reports/reports.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { Messages } from '@/common/constants/messages.constant';
import {
  ReportsPaginatedResponse,
  UserReportItem,
} from './interfaces/user-report.interface';
import { UploadedFileType } from '@/common/types/uploaded-file.type';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createReport(
    reporterId: number,
    dto: CreateUserReportDto,
    files: UploadedFileType[],
  ): Promise<UserReportItem> {
    // 1. Xử lý upload files
    const evidenceUrls = dto.evidenceUrls || [];
    if (files?.length) {
      for (const file of files) {
        let uploadResult;
        if (file.mimetype.startsWith('image/')) {
          uploadResult = await this.cloudinaryService.uploadImage(
            file,
            'reports/evidence',
          );
        } else if (file.mimetype.startsWith('video/')) {
          uploadResult = await this.cloudinaryService.uploadVideo(
            file,
            'reports/evidence_videos',
          );
        } else {
          throw new BadRequestException(
            'Only images and videos are allowed for evidence',
          );
        }
        evidenceUrls.push(uploadResult.secure_url);
      }
    }
    dto.evidenceUrls = evidenceUrls;

    // 2. Validate theo targetType
    if (dto.targetType === ReportTargetType.USER) {
      if (!dto.targetUserId) {
        throw new BadRequestException(Messages.REPORTS.INVALID_TARGET_TYPE);
      }
      if (dto.targetUserId === reporterId) {
        throw new BadRequestException(Messages.REPORTS.CANNOT_REPORT_SELF);
      }
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.targetUserId },
        select: { id: true, email: true, name: true },
      });
      if (!targetUser) {
        throw new BadRequestException(Messages.REPORTS.USER_NOT_FOUND);
      }
      const existing = await this.prisma.userReport.findFirst({
        where: {
          reporterId,
          targetUserId: dto.targetUserId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (existing) {
        throw new BadRequestException(Messages.REPORTS.ALREADY_REPORTED);
      }
    }

    if (dto.targetType === ReportTargetType.QUESTION) {
      if (!dto.targetQuestionId) {
        throw new BadRequestException(Messages.REPORTS.INVALID_TARGET_TYPE);
      }
      if (!dto.snapshotQuestionTitle) {
        const question = await this.prisma.question.findUnique({
          where: { id: dto.targetQuestionId },
          select: { title: true },
        });
        if (!question) {
          throw new BadRequestException(Messages.REPORTS.QUESTION_NOT_FOUND);
        }
        dto.snapshotQuestionTitle = question.title;
      }
    }

    // 3. Tạo report
    const report = await this.prisma.userReport.create({
      data: {
        reporterId,
        type: dto.type,
        targetType: dto.targetType,
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls,
        status: ReportStatus.PENDING,
        targetUserId:
          dto.targetType === ReportTargetType.USER ? dto.targetUserId : null,
        targetQuestionId:
          dto.targetType === ReportTargetType.QUESTION
            ? dto.targetQuestionId
            : null,
        snapshotQuestionTitle: dto.snapshotQuestionTitle || null,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    });
    return this.mapToUserReportItem(report);
  }

  async findAll(query: QueryReportsDto): Promise<ReportsPaginatedResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;

    const [reports, total] = await Promise.all([
      this.prisma.userReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
          targetComment: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userReport.count({ where }),
    ]);

    const items = reports.map((r) => this.mapToUserReportItem(r));
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<UserReportItem> {
    const report = await this.prisma.userReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        targetComment: { select: { id: true, content: true } },
      },
    });
    if (!report) {
      throw new NotFoundException(Messages.REPORTS.REPORT_NOT_FOUND);
    }
    return this.mapToUserReportItem(report);
  }

  async updateStatus(
    reportId: number,
    adminId: number,
    dto: UpdateReportStatusDto,
  ): Promise<UserReportItem> {
    const report = await this.prisma.userReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException(Messages.REPORTS.REPORT_NOT_FOUND);
    }
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Report này đã được xử lý trước đó');
    }

    const updated = await this.prisma.userReport.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        adminNote: dto.adminNote || null,
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    });
    return this.mapToUserReportItem(updated);
  }

  async reportComment(
    reporterId: number,
    dto: { commentId: number; reason: any },
  ) {
    // 1. Lấy comment và user ID của người viết comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: dto.commentId },
      select: { userId: true, content: true },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận này');
    }

    return this.prisma.userReport.create({
      data: {
        reporterId,
        targetCommentId: dto.commentId,
        targetUserId: comment.userId, // <-- Lưu thẳng tác giả comment vào đây
        targetType: ReportTargetType.COMMENT,
        type: dto.reason,
        reason: 'Báo cáo bình luận',
      },
    });
  }

  private mapToUserReportItem(report: any): UserReportItem {
    return {
      id: report.id,
      reporterId: report.reporterId,
      reporterName: report.reporter?.name || '',
      type: report.type,
      targetType: report.targetType,
      reason: report.reason,
      evidenceUrls: report.evidenceUrls,
      status: report.status,
      adminNote: report.adminNote,
      createdAt: report.createdAt.toISOString(),
      targetUserId: report.targetUserId,
      targetUserEmail: report.targetUser?.email || null,
      targetUserName: report.targetUser?.name || null,
      targetQuestionId: report.targetQuestionId,
      snapshotQuestionTitle: report.snapshotQuestionTitle,

      targetCommentId: report.targetCommentId,
      targetCommentContent:
        report.targetComment?.content || 'Bình luận này đã bị xóa',
    };
  }
}
