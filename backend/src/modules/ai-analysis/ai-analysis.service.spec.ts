import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysisService } from './ai-analysis.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import axios from 'axios';
import * as fs from 'fs';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import OpenAI from 'openai';

/* eslint-disable prettier/prettier */

jest.mock('microsoft-cognitiveservices-speech-sdk', () => {
  return {
    SpeechConfig: {
      fromSubscription: jest.fn().mockReturnValue({}),
    },
    AudioConfig: {
      fromWavFileInput: jest.fn().mockReturnValue({}),
    },
    // Quan trọng: Phải là jest.fn()
    SpeechRecognizer: jest.fn(),
    ResultReason: {
      RecognizedSpeech: 3, // Giá trị mặc định của SDK
      NoMatch: 4,
      Canceled: 5,
    }
  };
});

jest.mock('axios');
jest.mock('fs');
jest.mock('microsoft-cognitiveservices-speech-sdk');
jest.mock('openai');
jest.mock('child_process', () => ({
  execFile: jest.fn((file, args, cb) => cb(null, { stdout: '', stderr: '' })),
}));

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;
  //   let configService: DeepMocked<ConfigService>;
  let prismaService: DeepMocked<PrismaService>;
  let mockOpenAI: any;

  beforeEach(async () => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    (OpenAI as any).mockImplementation(() => mockOpenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalysisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'OPENROUTER_API_KEY': 'fake-key',
                'OPENROUTER_MODEL': 'gpt-4o',
                'AZURE_SPEECH_KEY': 'fake-azure-key',
                'AZURE_SPEECH_REGION': 'eastus',
              };
              return config[key] || null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<AiAnalysisService>(AiAnalysisService);
    prismaService = module.get(PrismaService);
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFeedback', () => {
    it('should return parsed feedback when AI returns valid JSON', async () => {
      const mockAiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 8,
                strengths: ['Clear voice'],
                weaknesses: ['Um and ah'],
                suggestions: ['Practice more'],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAiResponse);

      const result = await service.generateFeedback({
        transcript: 'Hello, I am a developer.',
        question: 'Intro',
      });

      expect(result.overallScore).toBe(8);
      expect(result.strengths).toContain('Clear voice');
    });

    it('should return default feedback when AI returns invalid JSON', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'not a json' } }],
      });

      const result = await service.generateFeedback({ transcript: 'test' });
      expect(result.overallScore).toBe(7);
    });
  });

  describe('saveSoloRecordingAnalysis', () => {
    it('should call prisma.aiAnalysis.upsert with correct data', async () => {
      const mockData = {
        soloRecordingId: 1,
        transcript: 'test transcript',
        overallScore: 9,
        strengths: ['S1'],
        weaknesses: ['W1'],
        suggestions: ['Sug1'],
      };

      await service.saveSoloRecordingAnalysis(mockData);

      expect(prismaService.aiAnalysis.upsert).toHaveBeenCalledWith({
        where: { soloRecordingId: 1 },
        update: expect.objectContaining({ transcript: 'test transcript' }),
        create: expect.objectContaining({ transcript: 'test transcript' }),
      });
    });
  });

  describe('transcribeFromAudioUrl', () => {
    it('should throw BadRequestException if transcript is empty', async () => {
      // Mock axios download
      (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('audio') });
      // Mock fs write/read
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('wav'));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      // Mock Azure SDK
      const mockRecognizer = {
        recognizeOnceAsync: jest.fn((cb) => {
          cb({
            reason: sdk.ResultReason.RecognizedSpeech,
            text: '', // Trả về text rỗng để gây lỗi
          });
        }),
        close: jest.fn(),
      };
      (sdk.SpeechRecognizer as any).mockImplementation(() => mockRecognizer);

      await expect(
        service.transcribeFromAudioUrl('http://link.com/audio.webm'),
      ).rejects.toThrow('Transcript rỗng');
    });
  });
});
