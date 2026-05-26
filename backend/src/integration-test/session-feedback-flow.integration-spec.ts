import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FeedbackStatus } from '@prisma/client';
import { FeedbackService } from '../modules/feedback/feedback.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Session Feedback Integration', () => {
  let service: FeedbackService;
  const feedbacks: any[] = [];
  const session = {
    id: 50,
    match: { candidateAId: 1, candidateBId: 2 },
    booking: null,
  };
  const prisma: any = {
    mockSession: { findUnique: jest.fn(async () => session) },
    feedback: {
      findFirst: jest.fn(
        async ({ where }: any) =>
          feedbacks.find(
            (fb) =>
              fb.sessionId === where.sessionId &&
              (where.reviewerId === undefined ||
                fb.reviewerId === where.reviewerId) &&
              (where.revieweeId === undefined ||
                fb.revieweeId === where.revieweeId) &&
              (!where.status || fb.status !== FeedbackStatus.PENDING),
          ) ?? null,
      ),
      create: jest.fn(async ({ data }: any) => {
        const item = {
          id: feedbacks.length + 1,
          ...data,
          createdAt: new Date(),
          reviewer: {
            name: data.reviewerId === 1 ? 'Candidate A' : 'Candidate B',
          },
        };
        feedbacks.push(item);
        return item;
      }),
      update: jest.fn(),
      findMany: jest.fn(async ({ where }: any) =>
        feedbacks
          .filter(
            (fb) =>
              fb.revieweeId === where.revieweeId &&
              fb.status !== FeedbackStatus.PENDING,
          )
          .map((fb) => ({
            ...fb,
            session: { source: 'P2P_MATCH' },
          })),
      ),
    },
  };

  beforeEach(async () => {
    feedbacks.length = 0;
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(FeedbackService);
  });

  it('participant submits feedback and the partner can read it in received feedback', async () => {
    const submitted = await service.submitFeedback(session.id, 1, {
      overallScore: 5,
      strengths: 'Clear explanations',
      comment: 'Good peer session',
      quickTags: ['clear'],
    });

    expect(submitted).toEqual(
      expect.objectContaining({
        reviewerId: 1,
        revieweeId: 2,
        status: FeedbackStatus.SUBMITTED,
      }),
    );
    const partner = await service.getPartnerFeedback(session.id, 2);
    expect(partner).toEqual(
      expect.objectContaining({
        reviewerName: 'Candidate A',
        comment: 'Good peer session',
      }),
    );
    const received = await service.getMyReceivedFeedbacks(2);
    expect(received[0]).toEqual(
      expect.objectContaining({
        sessionId: session.id,
        reviewerName: 'Candidate A',
      }),
    );
  });

  it('rejects feedback from outsiders and from solo sessions', async () => {
    await expect(
      service.submitFeedback(session.id, 99, {
        overallScore: 4,
        comment: 'No access',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.mockSession.findUnique.mockResolvedValueOnce({
      id: 60,
      match: null,
      booking: null,
    });
    await expect(
      service.submitFeedback(60, 1, { overallScore: 4, comment: 'Solo' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
