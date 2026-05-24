import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Messages } from '../../common/constants/messages.constant';
import { AiAgentService } from '../ai-analysis/ai-agent.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SoloRecordingExternalService } from './solo-recording-external.service';

describe('SoloRecordingExternalService', () => {
  let service: SoloRecordingExternalService;

  const cloudinaryService = {
    uploadVideo: jest.fn(),
  };

  const aiAgentService = {
    generateFeedback: jest.fn(),
  };

  const videoFile = {
    fieldname: 'file',
    originalname: 'answer.webm',
    encoding: '7bit',
    mimetype: 'video/webm',
    size: 4,
    buffer: Buffer.from('video'),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SoloRecordingExternalService,
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: AiAgentService, useValue: aiAgentService },
      ],
    }).compile();

    service = moduleRef.get(SoloRecordingExternalService);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads a valid video and maps the Cloudinary result', async () => {
    cloudinaryService.uploadVideo.mockResolvedValue({
      secure_url: 'https://cdn.test/video.webm',
      public_id: 'solo/video',
    });

    const result = await service.uploadVideo(videoFile);

    expect(cloudinaryService.uploadVideo).toHaveBeenCalledWith(
      videoFile,
      'interview_dojo/solo_recordings_video',
    );
    expect(result).toEqual({
      videoUrl: 'https://cdn.test/video.webm',
      publicId: 'solo/video',
    });
  });

  it('rejects missing, empty, or invalid video files', async () => {
    await expect(service.uploadVideo(undefined as any)).rejects.toThrow(
      Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
    );
    await expect(
      service.uploadVideo({ ...videoFile, buffer: Buffer.alloc(0) }),
    ).rejects.toThrow(Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED);
    await expect(
      service.uploadVideo({ ...videoFile, mimetype: 'image/png' }),
    ).rejects.toThrow(Messages.SOLO_RECORDING.ERROR_VIDEO_FILE);

    expect(cloudinaryService.uploadVideo).not.toHaveBeenCalled();
  });

  it('wraps a Cloudinary upload failure as a bad request', async () => {
    cloudinaryService.uploadVideo.mockRejectedValue(
      new Error('Cloudinary down'),
    );

    await expect(service.uploadVideo(videoFile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.uploadVideo(videoFile)).rejects.toThrow(
      Messages.SOLO_RECORDING.UPLOAD_VIDEO_FAILED,
    );
  });

  it('delegates transcript analysis and returns AI feedback fields', async () => {
    aiAgentService.generateFeedback.mockResolvedValue({
      overallScore: 7,
      strengths: ['Clear'],
      weaknesses: ['Brief'],
      suggestions: ['Expand'],
    });

    const result = await service.analyzeTranscript({
      transcript: 'My answer',
      question: 'Introduce yourself',
    });

    expect(aiAgentService.generateFeedback).toHaveBeenCalledWith({
      transcript: 'My answer',
      question: 'Introduce yourself',
    });
    expect(result).toEqual({
      overallScore: 7,
      strengths: ['Clear'],
      weaknesses: ['Brief'],
      suggestions: ['Expand'],
    });
  });
});
