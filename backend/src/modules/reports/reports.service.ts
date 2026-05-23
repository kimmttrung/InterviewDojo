import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ReportTargetType, ReportStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Messages } from '@/common/constants/messages.constant';
import {
  ReportsPaginatedResponse,
  UserReportItem,
} from './interfaces/user-report.interface';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(
    reporterId: number,
    dto: CreateUserReportDto,
  ): Promise<UserReportItem> {
    // ... giữ nguyên phần validate
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

    const report = await this.prisma.userReport.create({
      data: {
        reporterId,
        type: dto.type,
        targetType: dto.targetType,
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls || [],
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

  async findAll(
    query: QueryReportsDto,
    isAdmin: boolean,
  ): Promise<ReportsPaginatedResponse> {
    // Fix: đảm bảo page, limit là number
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;

    // Nếu không phải admin, chỉ lấy report của chính user đó
    if (!isAdmin) {
      // Bạn cần truyền reporterId vào, tạm thời comment
      // where.reporterId = reporterId;
    }

    const [reports, total] = await Promise.all([
      this.prisma.userReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
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
      },
    });
    if (!report) {
      throw new BadRequestException(Messages.REPORTS.REPORT_NOT_FOUND);
    }
    return this.mapToUserReportItem(report);
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
    };
  }
}
