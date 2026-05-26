const createMock = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  }));
});

import { AiService } from './ai-summary.service';
import { AI_MODEL } from '@/common/constants/ai.constant';

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiService();
  });

  it('summarizeFeedbacks - happy path', async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              strengths: ['Good communication'],
              weaknesses: ['Need more examples'],
              suggestions: ['Practice STAR method'],
              content: 'Overall good performance',
            }),
          },
        },
      ],
    });

    const result = await service.summarizeFeedbacks(
      [{ content: 'mentor feedback' }],
      [{ content: 'solo feedback' }],
      [{ content: 'p2p feedback' }],
    );

    expect(result.strengths).toEqual(['Good communication']);
    expect(result.weaknesses).toEqual(['Need more examples']);
    expect(result.suggestions).toEqual(['Practice STAR method']);
    expect(result.content).toBe('Overall good performance');

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: AI_MODEL.FEEDBACK_SUMMARY,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('MENTOR FEEDBACKS'),
          }),
        ],
      }),
    );
  });

  it('summarizeFeedbacks - throw when rawContent is empty', async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: '',
          },
        },
      ],
    });

    await expect(service.summarizeFeedbacks([], [], [])).rejects.toThrow(
      'AI summary generation failed',
    );
  });

  it('summarizeFeedbacks - throw when choices is empty', async () => {
    createMock.mockResolvedValue({
      choices: [],
    });

    await expect(service.summarizeFeedbacks([], [], [])).rejects.toThrow(
      'AI summary generation failed',
    );
  });

  it('summarizeFeedbacks - throw invalid JSON', async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'invalid-json',
          },
        },
      ],
    });

    await expect(service.summarizeFeedbacks([], [], [])).rejects.toThrow();
  });

  it('summarizeFeedbacks - pass all feedback arrays into prompt', async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              strengths: [],
              weaknesses: [],
              suggestions: [],
              content: 'ok',
            }),
          },
        },
      ],
    });

    await service.summarizeFeedbacks(
      [{ score: 9 }],
      [{ score: 7 }],
      [{ score: 8 }],
    );

    const callArg = createMock.mock.calls[0][0];
    const prompt = callArg.messages[0].content;

    expect(prompt).toContain(JSON.stringify([{ score: 9 }]));
    expect(prompt).toContain(JSON.stringify([{ score: 7 }]));
    expect(prompt).toContain(JSON.stringify([{ score: 8 }]));
  });
});
