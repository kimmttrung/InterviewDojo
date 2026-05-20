import { Injectable } from '@nestjs/common';

import Groq from 'groq-sdk';

import { AI_MODEL } from '@/common/constants/ai.constant';

import { AISummaryResult } from './ai-summary.interface';

@Injectable()
export class AiService {
  private readonly groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async summarizeFeedbacks(
    mentorFeedbacks: any[],
    soloFeedbacks: any[],
    p2pFeedbacks: any[],
  ): Promise<AISummaryResult> {
    const prompt = `
You are an interview coach AI.

Your task:
Analyze interview feedbacks.

Feedback priority:
1. Mentor feedback (highest)
2. Solo AI session
3. P2P session

Return STRICT JSON only.

Required JSON format:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "comment": "..."
}

Rules:
- strengths: max 5
- weaknesses: max 5
- suggestions: max 5
- comment: concise summary paragraph
- no markdown
- no explanation
- no extra text

MENTOR FEEDBACKS:
${JSON.stringify(mentorFeedbacks)}

SOLO FEEDBACKS:
${JSON.stringify(soloFeedbacks)}

P2P FEEDBACKS:
${JSON.stringify(p2pFeedbacks)}
`;

    const completion = await this.groq.chat.completions.create({
      model: AI_MODEL.FEEDBACK_SUMMARY,

      temperature: 0.3,

      response_format: {
        type: 'json_object',
      },

      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error('AI summary generation failed');
    }

    return JSON.parse(rawContent);
  }
}
