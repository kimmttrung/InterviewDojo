import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SoloRecordingDatabaseService } from './solo-recording-database.service';
import { SoloRecordingExternalService } from './solo-recording-external.service';
import { SoloRecordingService } from './solo-recording.service';

describe('SoloRecordingService', () => {
  let service: SoloRecordingService;

  const dbService = {
    createSoloSession: jest.fn(),
    saveFeedback: jest.fn(),
    findByUser: jest.fn(),
    updateRecordingUrl: jest.fn(),
  };

  const externalService = {
    uploadVideo: jest.fn(),
    analyzeTranscript: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SoloRecordingService,
        { provide: SoloRecordingDatabaseService, useValue: dbService },
        { provide: SoloRecordingExternalService, useValue: externalService },
      ],
    }).compile();

    service = moduleRef.get(SoloRecordingService);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates video upload to the external service', async () => {
    const file = {
      fieldname: 'file',
      originalname: 'answer.webm',
      encoding: '7bit',
      mimetype: 'video/webm',
      size: 3,
      buffer: Buffer.from('vid'),
    };
    externalService.uploadVideo.mockResolvedValue({
      videoUrl: '/video.webm',
      publicId: 'solo/video',
    });

    await expect(service.uploadVideo(file)).resolves.toEqual({
      videoUrl: '/video.webm',
      publicId: 'solo/video',
    });
    expect(externalService.uploadVideo).toHaveBeenCalledWith(file);
  });

  it('analyzes transcript, creates a solo session and saves AI feedback', async () => {
    const processedAt = new Date('2026-01-01T10:00:00.000Z');
    const analysis = {
      overallScore: 8,
      strengths: { clarity: 'Clear' },
      weaknesses: { detail: 'Needs detail' },
      suggestions: { examples: 'Use examples' },
    };
    externalService.analyzeTranscript.mockResolvedValue(analysis);
    dbService.createSoloSession.mockResolvedValue({ id: 44 });
    dbService.saveFeedback.mockResolvedValue({
      id: 55,
      createdAt: processedAt,
    });

    const result = await service.uploadAudioAndAnalyze({
      userId: 7,
      duration: 95,
      question: '  Explain dependency injection  ',
      transcript: '  My answer  ',
    });

    expect(externalService.analyzeTranscript).toHaveBeenCalledWith({
      transcript: 'My answer',
      question: 'Explain dependency injection',
    });
    expect(dbService.createSoloSession).toHaveBeenCalledWith({
      userId: 7,
      durationMinutes: 2,
      question: 'Explain dependency injection',
      answer: 'My answer',
      recordingUrl: undefined,
      publicId: undefined,
    });
    expect(dbService.saveFeedback).toHaveBeenCalledWith({
      sessionId: 44,
      revieweeId: 7,
      overallScore: 8,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      comment: 'My answer',
    });
    expect(result).toEqual({
      sessionId: 44,
      transcript: 'My answer',
      analysis,
      feedbackId: 55,
      processedAt,
    });
  });

  it('uses a fallback question when it is blank', async () => {
    externalService.analyzeTranscript.mockResolvedValue({
      overallScore: 5,
      strengths: {},
      weaknesses: {},
      suggestions: {},
    });
    dbService.createSoloSession.mockResolvedValue({ id: 1 });
    dbService.saveFeedback.mockResolvedValue({ id: 2, createdAt: new Date() });

    await service.uploadAudioAndAnalyze({
      userId: 1,
      duration: 60,
      question: ' ',
      transcript: 'answer',
    });

    expect(externalService.analyzeTranscript).toHaveBeenCalledWith({
      transcript: 'answer',
      question: 'Unknown question',
    });
  });

  it('uses zero minutes when recording duration is omitted', async () => {
    externalService.analyzeTranscript.mockResolvedValue({
      overallScore: 5,
      strengths: {},
      weaknesses: {},
      suggestions: {},
    });
    dbService.createSoloSession.mockResolvedValue({ id: 1 });
    dbService.saveFeedback.mockResolvedValue({ id: 2, createdAt: new Date() });

    await service.uploadAudioAndAnalyze({
      userId: 1,
      transcript: 'answer',
    } as any);

    expect(dbService.createSoloSession).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: 0 }),
    );
  });

  it('rejects an empty transcript before calling external services', async () => {
    await expect(
      service.uploadAudioAndAnalyze({
        userId: 1,
        duration: 60,
        transcript: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(externalService.analyzeTranscript).not.toHaveBeenCalled();
    expect(dbService.createSoloSession).not.toHaveBeenCalled();
  });

  it('delegates history lookup and video URL updates to the database service', async () => {
    dbService.findByUser.mockResolvedValue([{ id: 1 }]);
    dbService.updateRecordingUrl.mockResolvedValue({ id: 1 });

    await expect(service.findByUser(7)).resolves.toEqual([{ id: 1 }]);
    await expect(
      service.updateVideoUrl(1, '/new-video.webm', 'public/video'),
    ).resolves.toEqual({ id: 1 });

    expect(dbService.findByUser).toHaveBeenCalledWith(7);
    expect(dbService.updateRecordingUrl).toHaveBeenCalledWith(
      1,
      '/new-video.webm',
      'public/video',
    );
  });
});
