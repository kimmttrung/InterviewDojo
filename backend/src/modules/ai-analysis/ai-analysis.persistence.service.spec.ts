import { Test } from '@nestjs/testing';
import { FeedbackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiAnalysisService } from './ai-analysis.service';

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;
  const prisma = {
    mockSession: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiAnalysisService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(AiAnalysisService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches session feedback with solo and question relations', async () => {
    prisma.mockSession.findUnique.mockResolvedValue({ id: 4 });

    await expect(service.getSessionFeedback(4)).resolves.toEqual({ id: 4 });
    expect(prisma.mockSession.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: {
        soloSession: true,
        feedbacks: true,
        questions: { include: { question: true } },
      },
    });
  });

  it('stores transcript feedback and completes the solo session atomically', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const tx = {
      soloSession: { upsert: jest.fn().mockResolvedValue({}) },
      feedback: { create: jest.fn().mockResolvedValue({ id: 9 }) },
      mockSession: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    const result = await service.saveSoloSessionFeedback({
      sessionId: 4,
      revieweeId: 7,
      question: 'Question',
      transcript: 'Transcript',
      overallScore: 8,
      strengths: ['Clear'],
      weaknesses: ['Brief'],
      suggestions: ['Expand'],
    });

    expect(tx.soloSession.upsert).toHaveBeenCalledWith({
      where: { sessionId: 4 },
      update: { script: { question: 'Question', transcript: 'Transcript' } },
      create: {
        sessionId: 4,
        script: { question: 'Question', transcript: 'Transcript' },
      },
    });
    expect(tx.feedback.create).toHaveBeenCalledWith({
      data: {
        sessionId: 4,
        revieweeId: 7,
        overallScore: 8,
        strengths: ['Clear'],
        weaknesses: ['Brief'],
        suggestions: ['Expand'],
        comment: 'AI Generated Feedback',
        deadline: new Date('2026-01-04T00:00:00.000Z'),
        status: FeedbackStatus.SUBMITTED,
        quickTags: [],
      },
    });
    expect(tx.mockSession.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { status: 'COMPLETED' },
    });
    expect(result).toEqual({ id: 9 });
  });
});
