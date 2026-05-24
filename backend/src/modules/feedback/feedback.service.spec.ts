import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FeedbackStatus } from '@prisma/client';
import { Messages } from '../../common/constants/messages.constant';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  const prisma = {
    mockSession: {
      findUnique: jest.fn(),
    },
    feedback: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const deadline = new Date('2026-01-04T00:00:00.000Z');

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(FeedbackService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('submitFeedback', () => {
    it('creates submitted feedback for a P2P participant', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 10,
        match: { candidateAId: 1, candidateBId: 2 },
        booking: null,
      });
      prisma.feedback.findFirst.mockResolvedValue(null);
      prisma.feedback.create.mockImplementation(async ({ data }) => ({
        id: 100,
        ...data,
        createdAt,
      }));

      const result = await service.submitFeedback(10, 1, {
        overallScore: 5,
        strengths: 'Clear communication',
        comment: 'Useful practice',
        quickTags: ['helpful'],
      });

      expect(prisma.feedback.findFirst).toHaveBeenCalledWith({
        where: { sessionId: 10, reviewerId: 1, revieweeId: 2 },
      });
      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 10,
          reviewerId: 1,
          revieweeId: 2,
          overallScore: 5,
          strengths: 'Clear communication',
          comment: 'Useful practice',
          quickTags: ['helpful'],
          deadline: new Date('2026-01-04T00:00:00.000Z'),
          submittedAt: new Date('2026-01-01T00:00:00.000Z'),
          status: FeedbackStatus.SUBMITTED,
        }),
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 100,
          revieweeId: 2,
          status: FeedbackStatus.SUBMITTED,
        }),
      );
    });

    it('allows candidate B to submit P2P feedback back to candidate A', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 10,
        match: { candidateAId: 1, candidateBId: 2 },
        booking: null,
      });
      prisma.feedback.findFirst.mockResolvedValue(null);
      prisma.feedback.create.mockImplementation(async ({ data }) => ({
        id: 101,
        ...data,
        createdAt,
      }));

      const result = await service.submitFeedback(10, 2, {
        overallScore: 4,
        comment: 'Good',
      });

      expect(result.revieweeId).toBe(1);
    });

    it('updates pending mentor feedback as late when its deadline passed', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-05T00:00:00.000Z'));
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 20,
        match: null,
        booking: { mentorId: 8, candidateId: 9 },
      });
      prisma.feedback.findFirst.mockResolvedValue({
        id: 200,
        status: FeedbackStatus.PENDING,
        deadline,
      });
      prisma.feedback.update.mockImplementation(async ({ data }) => ({
        id: 200,
        sessionId: 20,
        reviewerId: 9,
        revieweeId: 8,
        deadline,
        createdAt,
        ...data,
      }));

      const result = await service.submitFeedback(20, 9, {
        overallScore: 3,
        weaknesses: 'Needs examples',
      });

      expect(prisma.feedback.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: expect.objectContaining({
          overallScore: 3,
          weaknesses: 'Needs examples',
          quickTags: [],
          status: FeedbackStatus.LATE,
        }),
      });
      expect(prisma.feedback.create).not.toHaveBeenCalled();
      expect(result.status).toBe(FeedbackStatus.LATE);
    });

    it('lets a mentor review a candidate and stores optional suggestion fields', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        id: 21,
        match: null,
        booking: { mentorId: 8, candidateId: 9 },
      });
      prisma.feedback.findFirst.mockResolvedValue(null);
      prisma.feedback.create.mockImplementation(async ({ data }) => ({
        id: 201,
        createdAt,
        ...data,
      }));

      const result = await service.submitFeedback(21, 8, {
        overallScore: 4,
        suggestions: 'Review async patterns',
      });

      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reviewerId: 8,
          revieweeId: 9,
          suggestions: 'Review async patterns',
        }),
      });
      expect(result.revieweeId).toBe(9);
    });

    it('rejects an outsider of a mentor booking and a zero-valued reviewee', async () => {
      prisma.mockSession.findUnique.mockResolvedValueOnce({
        match: null,
        booking: { mentorId: 8, candidateId: 9 },
      });
      await expect(
        service.submitFeedback(21, 99, {
          overallScore: 4,
          comment: 'No access',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      prisma.mockSession.findUnique.mockResolvedValueOnce({
        match: { candidateAId: 1, candidateBId: 0 },
        booking: null,
      });
      await expect(
        service.submitFeedback(22, 1, {
          overallScore: 4,
          comment: 'Invalid recipient',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when the session does not exist', async () => {
      prisma.mockSession.findUnique.mockResolvedValue(null);

      await expect(
        service.submitFeedback(999, 1, {
          overallScore: 4,
          comment: 'Comment',
        }),
      ).rejects.toThrow(Messages.FEEDBACK.SESSION_NOT_FOUND);
      await expect(
        service.submitFeedback(999, 1, {
          overallScore: 4,
          comment: 'Comment',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when the reviewer is not a participant', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        match: { candidateAId: 1, candidateBId: 2 },
        booking: null,
      });

      await expect(
        service.submitFeedback(10, 99, {
          overallScore: 4,
          comment: 'Comment',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when feedback is submitted for a solo session', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        match: null,
        booking: null,
      });

      await expect(
        service.submitFeedback(10, 1, {
          overallScore: 4,
          comment: 'Comment',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when feedback was already submitted', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        match: { candidateAId: 1, candidateBId: 2 },
        booking: null,
      });
      prisma.feedback.findFirst.mockResolvedValue({
        id: 1,
        status: FeedbackStatus.SUBMITTED,
      });

      await expect(
        service.submitFeedback(10, 1, {
          overallScore: 4,
          comment: 'Again',
        }),
      ).rejects.toThrow(Messages.FEEDBACK.ALREADY_SUBMITTED);
    });

    it('throws when no written feedback content is provided', async () => {
      prisma.mockSession.findUnique.mockResolvedValue({
        match: { candidateAId: 1, candidateBId: 2 },
        booking: null,
      });
      prisma.feedback.findFirst.mockResolvedValue(null);

      await expect(
        service.submitFeedback(10, 1, { overallScore: 4 }),
      ).rejects.toThrow(Messages.FEEDBACK.MISSING_REQUIRED_FIELDS);
      expect(prisma.feedback.create).not.toHaveBeenCalled();
    });
  });

  describe('feedback retrieval', () => {
    it('returns my mapped feedback or null', async () => {
      prisma.feedback.findFirst.mockResolvedValueOnce({
        id: 1,
        sessionId: 10,
        reviewerId: 1,
        revieweeId: 2,
        strengths: 'Good',
        weaknesses: null,
        suggestions: null,
        overallScore: 4,
        comment: 'Comment',
        quickTags: [],
        submittedAt: createdAt,
        deadline,
        status: FeedbackStatus.SUBMITTED,
        createdAt,
      });

      const result = await service.getMyFeedback(10, 1);

      expect(prisma.feedback.findFirst).toHaveBeenCalledWith({
        where: { sessionId: 10, reviewerId: 1 },
      });
      expect(result).toEqual(
        expect.objectContaining({ id: 1, status: FeedbackStatus.SUBMITTED }),
      );

      prisma.feedback.findFirst.mockResolvedValueOnce(null);
      await expect(service.getMyFeedback(10, 1)).resolves.toBeNull();
    });

    it('returns submitted partner feedback with reviewer name', async () => {
      prisma.feedback.findFirst.mockResolvedValue({
        overallScore: 5,
        comment: 'Strong performance',
        quickTags: ['clear'],
        strengths: 'Structure',
        weaknesses: null,
        suggestions: 'Continue',
        reviewer: { name: 'Reviewer' },
        createdAt,
      });

      const result = await service.getPartnerFeedback(10, 2);

      expect(prisma.feedback.findFirst).toHaveBeenCalledWith({
        where: {
          sessionId: 10,
          revieweeId: 2,
          status: { not: FeedbackStatus.PENDING },
        },
        include: { reviewer: { select: { name: true } } },
      });
      expect(result).toEqual(
        expect.objectContaining({
          reviewerName: 'Reviewer',
          overallScore: 5,
        }),
      );
    });

    it('returns null partner feedback and uses unknown names when reviewer data is absent', async () => {
      prisma.feedback.findFirst.mockResolvedValueOnce(null);
      await expect(service.getPartnerFeedback(10, 2)).resolves.toBeNull();

      prisma.feedback.findFirst.mockResolvedValueOnce({
        overallScore: 3,
        comment: 'Anonymous',
        quickTags: [],
        strengths: null,
        weaknesses: null,
        suggestions: null,
        reviewer: null,
        createdAt,
      });
      await expect(service.getPartnerFeedback(10, 2)).resolves.toEqual(
        expect.objectContaining({ reviewerName: 'Unknown' }),
      );

      prisma.feedback.findMany.mockResolvedValue([
        {
          id: 6,
          sessionId: 30,
          session: { source: 'P2P_MATCH' },
          reviewer: null,
          overallScore: 3,
          comment: null,
          quickTags: [],
          strengths: null,
          weaknesses: null,
          suggestions: null,
          createdAt,
        },
      ]);
      await expect(service.getMyReceivedFeedbacks(2)).resolves.toEqual([
        expect.objectContaining({ reviewerName: 'Unknown' }),
      ]);
    });

    it('maps received feedbacks and excludes pending records in the query', async () => {
      prisma.feedback.findMany.mockResolvedValue([
        {
          id: 5,
          sessionId: 30,
          session: { source: 'P2P_MATCH' },
          reviewer: { name: 'Peer', avatarUrl: '/peer.png' },
          overallScore: 4,
          comment: 'Good',
          quickTags: ['prepared'],
          strengths: 'Communication',
          weaknesses: null,
          suggestions: null,
          createdAt,
        },
      ]);

      const result = await service.getMyReceivedFeedbacks(2);

      expect(prisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            revieweeId: 2,
            status: { not: FeedbackStatus.PENDING },
          },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: 5,
          sessionType: 'P2P_MATCH',
          reviewerName: 'Peer',
          reviewerAvatar: '/peer.png',
        }),
      ]);
    });
  });
});
