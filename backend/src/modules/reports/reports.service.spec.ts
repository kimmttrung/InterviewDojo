import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportStatus, ReportTargetType, ReportType } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let cloudinaryService: jest.Mocked<
    Pick<CloudinaryService, 'uploadImage' | 'uploadVideo'>
  >;

  const report = {
    id: 10,
    reporterId: 1,
    reporter: { id: 1, name: 'Candidate', email: 'candidate@test.com' },
    type: ReportType.HARASSMENT,
    targetType: ReportTargetType.USER,
    reason: 'Bad behavior',
    evidenceUrls: [],
    status: ReportStatus.PENDING,
    adminNote: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    targetUserId: 2,
    targetUser: { id: 2, name: 'Mentor', email: 'mentor@test.com' },
    targetQuestionId: null,
    snapshotQuestionTitle: null,
    targetCommentId: null,
    targetComment: null,
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      question: { findUnique: jest.fn() },
      userReport: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      comment: { findUnique: jest.fn() },
    };

    cloudinaryService = {
      uploadImage: jest.fn(),
      uploadVideo: jest.fn(),
    };

    service = new ReportsService(
      prisma,
      cloudinaryService as unknown as CloudinaryService,
    );
  });

  it('creates a user report with uploaded evidence', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.userReport.findFirst.mockResolvedValue(null);
    prisma.userReport.create.mockResolvedValue({
      ...report,
      evidenceUrls: ['https://cdn.test/evidence.png'],
    });
    cloudinaryService.uploadImage.mockResolvedValue({
      secure_url: 'https://cdn.test/evidence.png',
    } as any);

    const result = await service.createReport(
      1,
      {
        targetType: ReportTargetType.USER,
        type: ReportType.HARASSMENT,
        reason: 'Bad behavior',
        targetUserId: 2,
      },
      [{ mimetype: 'image/png' } as any],
    );

    expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
      { mimetype: 'image/png' },
      'reports/evidence',
    );
    expect(prisma.userReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reporterId: 1,
        targetType: ReportTargetType.USER,
        targetUserId: 2,
        evidenceUrls: ['https://cdn.test/evidence.png'],
        status: ReportStatus.PENDING,
      }),
      include: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 10,
        targetUserEmail: 'mentor@test.com',
        status: ReportStatus.PENDING,
      }),
    );
  });

  it('rejects duplicate reports against the same user within seven days', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.userReport.findFirst.mockResolvedValue({ id: 99 });

    await expect(
      service.createReport(
        1,
        {
          targetType: ReportTargetType.USER,
          type: ReportType.SCAM,
          reason: 'Duplicate',
          targetUserId: 2,
        },
        [],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.userReport.create).not.toHaveBeenCalled();
  });

  it('creates a question report and snapshots the question title', async () => {
    prisma.question.findUnique.mockResolvedValue({ title: 'Two Sum' });
    prisma.userReport.create.mockResolvedValue({
      ...report,
      type: ReportType.WRONG_ANSWER,
      targetType: ReportTargetType.QUESTION,
      targetUserId: null,
      targetUser: null,
      targetQuestionId: 7,
      snapshotQuestionTitle: 'Two Sum',
    });

    await service.createReport(
      1,
      {
        targetType: ReportTargetType.QUESTION,
        type: ReportType.WRONG_ANSWER,
        reason: 'Answer is wrong',
        targetQuestionId: 7,
      },
      [],
    );

    expect(prisma.userReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetQuestionId: 7,
        snapshotQuestionTitle: 'Two Sum',
      }),
      include: expect.any(Object),
    });
  });

  it('updates a pending report status by admin', async () => {
    prisma.userReport.findUnique.mockResolvedValue(report);
    prisma.userReport.update.mockResolvedValue({
      ...report,
      status: ReportStatus.RESOLVED,
      adminNote: 'Handled',
    });

    const result = await service.updateStatus(10, 99, {
      status: ReportStatus.RESOLVED,
      adminNote: 'Handled',
    });

    expect(prisma.userReport.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        status: ReportStatus.RESOLVED,
        adminNote: 'Handled',
        resolvedById: 99,
      }),
      include: expect.any(Object),
    });
    expect(result.status).toBe(ReportStatus.RESOLVED);
  });

  it('throws when updating a missing report', async () => {
    prisma.userReport.findUnique.mockResolvedValue(null);

    await expect(
      service.updateStatus(404, 99, { status: ReportStatus.REJECTED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a comment report against the comment author', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      userId: 5,
      content: 'Spam comment',
    });
    prisma.userReport.create.mockResolvedValue({ id: 20 });

    await service.reportComment(1, {
      commentId: 3,
      reason: ReportType.SPAM,
    });

    expect(prisma.userReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reporterId: 1,
        targetCommentId: 3,
        targetUserId: 5,
        targetType: ReportTargetType.COMMENT,
        type: ReportType.SPAM,
      }),
    });
  });
});
