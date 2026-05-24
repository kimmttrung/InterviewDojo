import { Test } from '@nestjs/testing';
import {
  FeedbackStatus,
  SessionMode,
  SessionSource,
  SessionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SoloRecordingDatabaseService } from './solo-recording-database.service';

describe('SoloRecordingDatabaseService', () => {
  let service: SoloRecordingDatabaseService;

  const prisma = {
    mockSession: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    feedback: {
      create: jest.fn(),
    },
    soloSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SoloRecordingDatabaseService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SoloRecordingDatabaseService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a completed solo session with a conversation script', async () => {
    const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
    prisma.mockSession.create.mockResolvedValue({ id: 1 });

    await service.createSoloSession({
      userId: 7,
      durationMinutes: 90,
      question: 'Question',
      answer: 'Answer',
      scheduledAt,
      recordingUrl: '/video.webm',
      publicId: 'public/video',
    });

    expect(prisma.mockSession.create).toHaveBeenCalledWith({
      data: {
        intervieweeId: 7,
        scheduledAt,
        durationMinutes: 90,
        status: SessionStatus.COMPLETED,
        source: SessionSource.SOLO,
        mode: SessionMode.SOLO,
        recordingUrl: '/video.webm',
        meetingLink: 'public/video',
        soloSession: {
          create: {
            script: {
              conversations: [
                {
                  question: 'Question',
                  answer: 'Answer',
                  createdAt: scheduledAt.toISOString(),
                },
              ],
            },
          },
        },
      },
      include: { soloSession: true },
    });
  });

  it('saves submitted AI feedback with a three-day deadline', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    prisma.feedback.create.mockResolvedValue({ id: 3 });

    await service.saveFeedback({
      sessionId: 2,
      revieweeId: 7,
      overallScore: 8,
      strengths: { one: 'Clear' },
      weaknesses: { one: 'Short' },
      suggestions: { one: 'Expand' },
      comment: 'Transcript',
    });

    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        sessionId: 2,
        revieweeId: 7,
        overallScore: 8,
        strengths: { one: 'Clear' },
        weaknesses: { one: 'Short' },
        suggestions: { one: 'Expand' },
        comment: 'Transcript',
        deadline: new Date('2026-01-04T00:00:00.000Z'),
        status: FeedbackStatus.SUBMITTED,
        quickTags: [],
      },
    });
  });

  it('stores null comment when AI feedback has no transcript comment', async () => {
    prisma.feedback.create.mockResolvedValue({ id: 4 });

    await service.saveFeedback({
      sessionId: 2,
      revieweeId: 7,
      overallScore: 5,
      strengths: {},
      weaknesses: {},
      suggestions: {},
    });

    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ comment: null }),
    });
  });

  it('updates the recording URL and Cloudinary public id', async () => {
    prisma.mockSession.update.mockResolvedValue({ id: 5 });

    await service.updateRecordingUrl(5, '/video.mp4', 'solo/public');

    expect(prisma.mockSession.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        recordingUrl: '/video.mp4',
        meetingLink: 'solo/public',
      },
      include: { soloSession: true },
    });
  });

  it('appends a conversation to an existing solo session script', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    prisma.soloSession.findFirst.mockResolvedValue({
      script: {
        conversations: [
          {
            question: 'First',
            answer: 'Answer one',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });
    prisma.soloSession.update.mockResolvedValue({ sessionId: 8 });

    await service.appendConversation({
      sessionId: 8,
      question: 'Second',
      answer: 'Answer two',
    });

    expect(prisma.soloSession.update).toHaveBeenCalledWith({
      where: { sessionId: 8 },
      data: {
        script: {
          conversations: [
            {
              question: 'First',
              answer: 'Answer one',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              question: 'Second',
              answer: 'Answer two',
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
        },
      },
    });
  });

  it('starts a conversation list when no previous script exists', async () => {
    prisma.soloSession.findFirst.mockResolvedValue(null);
    prisma.soloSession.update.mockResolvedValue({ sessionId: 9 });

    await service.appendConversation({
      sessionId: 9,
      question: 'First',
      answer: 'Answer',
    });

    expect(prisma.soloSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          script: {
            conversations: [
              expect.objectContaining({ question: 'First', answer: 'Answer' }),
            ],
          },
        },
      }),
    );
  });

  it('queries solo recording history and a single session with related data', async () => {
    prisma.mockSession.findMany.mockResolvedValue([]);
    prisma.mockSession.findUnique.mockResolvedValue({ id: 10 });

    await service.findByUser(7);
    await service.findOne(10);

    expect(prisma.mockSession.findMany).toHaveBeenCalledWith({
      where: {
        intervieweeId: 7,
        mode: SessionMode.SOLO,
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        soloSession: true,
        feedbacks: true,
      },
    });
    expect(prisma.mockSession.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      include: {
        soloSession: true,
        feedbacks: true,
      },
    });
  });
});
