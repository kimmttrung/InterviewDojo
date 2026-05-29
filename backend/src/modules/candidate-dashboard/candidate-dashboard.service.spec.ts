import { Test } from '@nestjs/testing';
import { BookingStatus, SessionSource } from '@prisma/client';
import { AiService } from '../ai-summary/ai-summary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './candidate-dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const prisma = {
    booking: { findMany: jest.fn() },
    feedback: { findMany: jest.fn() },
    mockSession: { findMany: jest.fn() },
    codeSubmission: { count: jest.fn() },
    userBookmark: { count: jest.fn(), findMany: jest.fn() },
  };
  const aiService = { summarizeFeedbacks: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
    jest.clearAllMocks();
  });

  it('maps accepted future bookings into upcoming sessions', async () => {
    const startTime = new Date('2026-06-01T10:00:00.000Z');
    const endTime = new Date('2026-06-01T11:00:00.000Z');
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 1,
        status: BookingStatus.ACCEPTED,
        startTime,
        endTime,
        mentor: { id: 2, name: 'Mentor', avatarUrl: '/avatar.png' },
        coachingPlan: { id: 3, title: 'Backend', duration: 60 },
      },
    ]);

    const result = await service.getUpcomingSessions(7);

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          candidateId: 7,
          status: BookingStatus.ACCEPTED,
        }),
        orderBy: { startTime: 'asc' },
        take: 3,
      }),
    );
    expect(result[0]).toEqual({
      id: 1,
      mentor: { id: 2, name: 'Mentor', avatarUrl: '/avatar.png' },
      coachingPlan: { id: 3, title: 'Backend', duration: 60 },
      startTime,
      endTime,
      status: BookingStatus.ACCEPTED,
    });
  });

  it('partitions feedback by source before generating an AI summary', async () => {
    prisma.feedback.findMany.mockResolvedValue([
      {
        session: { source: SessionSource.MENTOR_BOOKING },
        strengths: ['mentor'],
        weaknesses: null,
        suggestions: ['practice'],
        comment: 'm',
        overallScore: 9,
      },
      {
        session: { source: SessionSource.SOLO },
        strengths: null,
        weaknesses: ['solo weakness'],
        suggestions: null,
        comment: 's',
        overallScore: 7,
      },
      {
        session: { source: SessionSource.P2P_MATCH },
        strengths: ['peer'],
        weaknesses: [],
        suggestions: [],
        comment: 'p',
        overallScore: 8,
      },
    ]);
    aiService.summarizeFeedbacks.mockResolvedValue({ content: 'summary' });

    await expect(service.getAISummary(7)).resolves.toEqual({
      content: 'summary',
    });
    expect(aiService.summarizeFeedbacks).toHaveBeenCalledWith(
      [
        {
          strengths: ['mentor'],
          weaknesses: [],
          suggestions: ['practice'],
          comment: 'm',
          score: 9,
        },
      ],
      [
        {
          strengths: [],
          weaknesses: ['solo weakness'],
          suggestions: [],
          comment: 's',
          score: 7,
        },
      ],
      [
        {
          strengths: ['peer'],
          weaknesses: [],
          suggestions: [],
          comment: 'p',
          score: 8,
        },
      ],
    );
  });

  it('calculates analytics averages and session source breakdown', async () => {
    const first = new Date('2026-01-01T00:00:00.000Z');
    const second = new Date('2026-01-02T00:00:00.000Z');
    prisma.feedback.findMany.mockResolvedValue([
      { overallScore: 7, createdAt: first },
      { overallScore: 8, createdAt: second },
    ]);
    prisma.mockSession.findMany.mockResolvedValue([
      { id: 1, source: SessionSource.MENTOR_BOOKING },
      { id: 2, source: SessionSource.P2P_MATCH },
      { id: 3, source: SessionSource.SOLO },
      { id: 4, source: SessionSource.SOLO },
    ]);
    prisma.codeSubmission.count.mockResolvedValue(4);
    prisma.userBookmark.count.mockResolvedValue(6);

    const result = await service.getAnalyticsOverview(7);

    expect(result).toEqual({
      completedSessions: 4,
      overallScore: 7.5,
      completedCodingQuestions: 4,
      savedQuestions: 6,
      scoreChart: [
        {
          date: new Date('2026-01-01'),
          score: 7,
          sessionType: 'UNKNOWN',
        },
        {
          date: new Date('2026-01-02'),
          score: 8,
          sessionType: 'UNKNOWN',
        },
      ],
      sessionBreakdown: {
        mentor: 1,
        p2p: 1,
        solo: 2,
      },
    });
  });

  it('returns zero overall score when no feedback exists', async () => {
    prisma.feedback.findMany.mockResolvedValue([]);
    prisma.mockSession.findMany.mockResolvedValue([]);
    prisma.codeSubmission.count.mockResolvedValue(0);
    prisma.userBookmark.count.mockResolvedValue(0);

    const result = await service.getAnalyticsOverview(7);

    expect(result.overallScore).toBe(0);
  });

  it('ranks bookmarked categories by occurrence and returns only five', async () => {
    prisma.userBookmark.findMany.mockResolvedValue([
      {
        question: {
          categories: [
            { category: { id: 1, name: 'Node' } },
            { category: { id: 2, name: 'SQL' } },
          ],
        },
      },
      {
        question: {
          categories: [
            { category: { id: 1, name: 'Node' } },
            { category: { id: 3, name: 'React' } },
          ],
        },
      },
      ...[4, 5, 6, 7].map((id) => ({
        question: {
          categories: [{ category: { id, name: `Category ${id}` } }],
        },
      })),
    ]);

    const result = await service.getInterestedCategories(7);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ id: 1, name: 'Node', count: 2 });
  });
});
