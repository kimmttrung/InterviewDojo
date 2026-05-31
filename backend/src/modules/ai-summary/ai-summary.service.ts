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

  /**
   * Tóm tắt và cô đọng Bio của Mentor, loại bỏ dữ liệu nhiễu để phục vụ cho việc tạo Vector Embedding
   * Endpoint/Service: AiService
   */
  async summarizeMentorBio(rawBio: string): Promise<string> {
    if (!rawBio || !rawBio.trim()) {
      return '';
    }

    const prompt = `
You are an expert AI Data Engineer specializing in profile parsing and semantic search optimization.

Your task:
Extract and summarize the core professional attributes from the mentor's raw biography below. Remove all conversational filler, greetings, names, and non-professional noise. 

Focus heavily on preserving and condensing:
1. Core Tech Stacks & Core Competencies (Languages, Frameworks, Tools).
2. Professional Domains (Backend, Frontend, AI/ML, DevOps, System Design, Cloud).
3. Professional Achievements, Mentoring Style, or Years of Experience if mentioned.

Rules:
- Return ONLY a concise, dense, semantic summary paragraph (plain text).
- Do NOT include any markdown, intro ("Here is the summary"), or extra explanation.
- Keep the language consistent with the original text (Vietnamese or English).
- Max 3-4 dense sentences.

RAW BIOGRAPHY:
"${rawBio}"
`;

    // Bạn có thể dùng AI_MODEL.FEEDBACK_SUMMARY hoặc một constant model thích hợp khác trong hằng số của bạn (Ví dụ: llama-3.3-70b-versatile)
    const completion = await this.groq.chat.completions.create({
      model: AI_MODEL.FEEDBACK_SUMMARY,
      temperature: 0.1, // Set temperature thấp để model không "sáng tạo" thêm thông tin rác
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summarizedContent = completion.choices[0]?.message?.content;

    if (!summarizedContent) {
      return rawBio; // Fallback trả về bio gốc nếu AI gặp sự cố
    }

    return summarizedContent.trim();
  }
}
