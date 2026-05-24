import { Test } from '@nestjs/testing';
import {
  FeedbackStatus,
  SessionMode,
  SessionSource,
  SessionStatus,
} from '@prisma/client';
import { SoloRecordingDatabaseService } from '../modules/solo-recording/solo-recording-database.service';
import { SoloRecordingExternalService } from '../modules/solo-recording/solo-recording-external.service';
import { SoloRecordingService } from '../modules/solo-recording/solo-recording.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Solo Recording Analysis Integration', () => {
  let service: SoloRecordingService;
  let databaseService: SoloRecordingDatabaseService;
  const sessions: any[] = [];
  const feedbacks: any[] = [];
  const externalService = {
    analyzeTranscript: jest.fn(),
    uploadVideo: jest.fn(),
  };
  const prisma: any = {
    mockSession: {
      create: jest.fn(async ({ data }: any) => {
        const item = { id: sessions.length + 1, ...data, feedbacks: [] };
        sessions.push(item);
        return item;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        sessions
          .filter(
            (item) =>
              item.intervieweeId === where.intervieweeId &&
              item.mode === where.mode,
          )
          .map((item) => ({
            ...item,
            feedbacks: feedbacks.filter((fb) => fb.sessionId === item.id),
          })),
      ),
      update: jest.fn(),
    },
    feedback: {
      create: jest.fn(async ({ data }: any) => {
        const item = {
          id: feedbacks.length + 1,
          ...data,
          createdAt: new Date(),
        };
        feedbacks.push(item);
        return item;
      }),
    },
  };

  beforeEach(async () => {
    sessions.length = 0;
    feedbacks.length = 0;
    jest.clearAllMocks();
    externalService.analyzeTranscript.mockResolvedValue({
      overallScore: 8,
      strengths: { clarity: 'Clear structure' },
      weaknesses: { examples: 'Few examples' },
      suggestions: { practice: 'Add examples' },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        SoloRecordingService,
        SoloRecordingDatabaseService,
        { provide: SoloRecordingExternalService, useValue: externalService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(SoloRecordingService);
    databaseService = moduleRef.get(SoloRecordingDatabaseService);
  });

  it('transcript analysis creates a completed solo session with AI feedback readable in history', async () => {
    const result = await service.uploadAudioAndAnalyze({
      userId: 7,
      duration: 95,
      question: 'Explain dependency injection',
      transcript: 'I use injected dependencies through constructors.',
    });

    expect(result).toEqual(
      expect.objectContaining({ sessionId: 1, feedbackId: 1 }),
    );
    expect(sessions[0]).toEqual(
      expect.objectContaining({
        intervieweeId: 7,
        durationMinutes: 2,
        status: SessionStatus.COMPLETED,
        source: SessionSource.SOLO,
        mode: SessionMode.SOLO,
      }),
    );
    expect(feedbacks[0]).toEqual(
      expect.objectContaining({
        sessionId: 1,
        revieweeId: 7,
        status: FeedbackStatus.SUBMITTED,
        comment: 'I use injected dependencies through constructors.',
      }),
    );

    const history = await databaseService.findByUser(7);
    expect(history[0].feedbacks).toHaveLength(1);
  });
});
