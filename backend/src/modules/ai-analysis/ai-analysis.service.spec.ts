import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiAgentService } from './ai-agent.service';
import Groq from 'groq-sdk';

jest.mock('groq-sdk');

describe('AiAgentService', () => {
  let service: AiAgentService;

  const mockCreate = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFeedback', () => {
    it('should return parsed AI feedback successfully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 8,
                strengths: ['Strong 1', 'Strong 2', 'Strong 3'],
                weaknesses: ['Weak 1', 'Weak 2', 'Weak 3'],
                suggestions: ['Sug 1', 'Sug 2', 'Sug 3'],
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

      expect(result.strengths).toHaveLength(3);
      expect(result.weaknesses).toHaveLength(3);
      expect(result.suggestions).toHaveLength(3);

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
  "strengths": ["A", "B", "C"],
  "weaknesses": ["D", "E", "F"],
  "suggestions": ["G", "H", "I"]
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
      expect(result.strengths).toEqual(['A', 'B', 'C']);
    });

    it('should normalize score to max 10', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 99,
                strengths: ['A', 'B', 'C'],
                weaknesses: ['D', 'E', 'F'],
                suggestions: ['G', 'H', 'I'],
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
                strengths: ['A', 'B', 'C'],
                weaknesses: ['D', 'E', 'F'],
                suggestions: ['G', 'H', 'I'],
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

      expect(result.strengths.length).toBeGreaterThanOrEqual(3);
      expect(result.weaknesses.length).toBeGreaterThanOrEqual(3);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('should use fallback arrays when AI arrays are invalid', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 6,
                strengths: ['A'],
                weaknesses: 'invalid',
                suggestions: [],
              }),
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Test',
      });

      expect(result.overallScore).toBe(6);

      expect(result.strengths.length).toBeGreaterThanOrEqual(3);
      expect(result.weaknesses.length).toBeGreaterThanOrEqual(3);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
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

      expect(result.strengths.length).toBeGreaterThanOrEqual(3);
      expect(result.weaknesses.length).toBeGreaterThanOrEqual(3);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    });
  });
});
