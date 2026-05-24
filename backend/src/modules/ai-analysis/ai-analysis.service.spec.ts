import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiAgentService } from './ai-agent.service';
import Groq from 'groq-sdk';

jest.mock('groq-sdk');

describe('AiAgentService', () => {
  let service: AiAgentService;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  const mockCreate = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    (Groq as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAgentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GROQ_API_KEY: 'fake-api-key',
                GROQ_MODEL: 'llama-3.3-70b-versatile',
              };

              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiAgentService>(AiAgentService);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should require an api key and use the default model when not configured', async () => {
    expect(
      () =>
        new AiAgentService({
          get: jest.fn().mockReturnValue(undefined),
        } as any),
    ).toThrow('Missing GROQ_API_KEY');

    const defaultModelService = new AiAgentService({
      get: jest.fn((key: string) =>
        key === 'GROQ_API_KEY' ? 'fake-api-key' : undefined,
      ),
    } as any);
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              overallScore: 5,
              strengths: ['one', 'two', 'three'],
              weaknesses: ['one', 'two', 'three'],
              suggestions: ['one', 'two', 'three'],
            }),
          },
        },
      ],
    });

    await defaultModelService.generateFeedback({ transcript: 'answer' });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'llama-3.3-70b-versatile' }),
    );
  });

  describe('generateFeedback', () => {
    it('should return parsed AI feedback successfully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 8,
                strengths: {
                  communication: 'Giao tiếp tốt',
                  confidence: 'Tự tin',
                  structure: 'Trả lời có cấu trúc',
                },
                weaknesses: {
                  detail: 'Thiếu chi tiết',
                  speed: 'Nói hơi nhanh',
                  examples: 'Ít ví dụ thực tế',
                },
                suggestions: {
                  practice: 'Luyện mock interview',
                  improve: 'Bổ sung ví dụ',
                  pacing: 'Điều chỉnh tốc độ nói',
                },
              }),
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Tôi có kinh nghiệm NestJS',
        question: 'Giới thiệu bản thân',
      });

      expect(result.overallScore).toBe(8);

      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.suggestions).toBeDefined();

      expect(mockCreate).toHaveBeenCalled();
    });

    it('should clean markdown json response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: `
\`\`\`json
{
  "overallScore": 7,
  "strengths": {
    "a": "A"
  },
  "weaknesses": {
    "b": "B"
  },
  "suggestions": {
    "c": "C"
  }
}
\`\`\`
              `,
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Test transcript',
      });

      expect(result.overallScore).toBe(7);
      expect(result.strengths).toBeDefined();
    });

    it('should normalize score to max 10', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 99,
                strengths: {},
                weaknesses: {},
                suggestions: {},
              }),
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Test',
      });

      expect(result.overallScore).toBe(10);
    });

    it('should normalize score to min 0', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: -5,
                strengths: {},
                weaknesses: {},
                suggestions: {},
              }),
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Test',
      });

      expect(result.overallScore).toBe(0);
    });

    it('should use fallback when parse json failed', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json response',
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Test',
      });

      expect(result.overallScore).toBe(5);

      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should throw BadRequestException if transcript is empty', async () => {
      await expect(
        service.generateFeedback({
          transcript: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return fallback response when groq throws error', async () => {
      mockCreate.mockRejectedValue(new Error('Groq API Error'));

      const result = await service.generateFeedback({
        transcript: 'Test transcript',
      });

      expect(result.overallScore).toBe(4);

      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should clean valid array items and fallback when the AI returns no content', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: null,
                strengths: [' a ', '', 3, 'b', 'c', 'd', 'e', 'f'],
                weaknesses: ['w1', 'w2', 'w3'],
                suggestions: ['s1', 's2', 's3'],
              }),
            },
          },
        ],
      });

      const normalized = await service.generateFeedback({ transcript: 'Test' });
      expect(normalized.overallScore).toBe(5);
      expect(normalized.strengths).toEqual(['a', 'b', 'c', 'd', 'e']);

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 5,
                strengths: ['only one'],
                weaknesses: ['w1', 'w2', 'w3'],
                suggestions: ['s1', 's2', 's3'],
              }),
            },
          },
        ],
      });
      const shortList = await service.generateFeedback({ transcript: 'Test' });
      expect(shortList.strengths).toHaveLength(3);

      mockCreate.mockResolvedValueOnce({ choices: [] });
      await expect(
        service.generateFeedback({ transcript: 'Test' }),
      ).resolves.toEqual(expect.objectContaining({ overallScore: 5 }));
    });
  });
});
