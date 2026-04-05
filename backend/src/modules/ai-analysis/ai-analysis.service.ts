import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

type FeedbackResult = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

@Injectable()
export class AiAnalysisService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    console.log('OpenRouter ready');
  }

  async transcribeFromFile(file: UploadedFileType): Promise<string> {
    if (!file) {
      throw new BadRequestException('Thiếu file audio');
    }

    if (!file.buffer) {
      throw new BadRequestException('File upload không có buffer');
    }

    const tmpDir = join(process.cwd(), 'tmp');
    const tempFilePath = join(tmpDir, `${Date.now()}-${file.originalname}`);

    try {
      await mkdir(tmpDir, { recursive: true });
      await writeFile(tempFilePath, file.buffer);

      const transcript = await this.runWhisperScript(tempFilePath);

      if (!transcript.trim()) {
        throw new Error('Transcript rỗng');
      }

      return transcript;
    } catch (error) {
      console.error('Local whisper transcription error:', error);
      throw new InternalServerErrorException(
        'Không thể chuyển audio thành văn bản',
      );
    } finally {
      try {
        await unlink(tempFilePath);
      } catch {
        // bỏ qua lỗi xóa file tạm
      }
    }
  }

  private runWhisperScript(audioPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(
        process.cwd(),
        'scripts',
        'transcribe_whisper.py',
      );

      const pythonProcess = spawn('python', [scriptPath, audioPath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(
            new Error(`Whisper script failed. Code=${code}. Error=${stderr}`),
          );
        }

        try {
          const parsed = JSON.parse(stdout) as { transcript?: string };
          resolve(parsed.transcript || '');
        } catch (error) {
          reject(
            new Error(
              `Cannot parse whisper output: ${stdout}\n${String(error)}`,
            ),
          );
        }
      });
    });
  }

  async generateFeedback(params: {
    transcript: string;
    question?: string;
  }): Promise<FeedbackResult> {
    const { transcript, question } = params;

    if (!transcript?.trim()) {
      throw new BadRequestException('Transcript rỗng');
    }

    const prompt = `
You are an interview evaluator.

Question: ${question || 'Tell me about yourself'}
Answer: ${transcript}

Return ONLY valid JSON in this format:
{
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}
`;

    try {
      const model =
        this.configService.get<string>('OPENROUTER_MODEL') || 'openrouter/free';

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? '';

      console.log('AI RAW RESPONSE:', text);

      try {
        const parsed = JSON.parse(text) as FeedbackResult;

        return {
          overallScore: Number(parsed.overallScore ?? 7),
          strengths: Array.isArray(parsed.strengths)
            ? parsed.strengths
            : ['Good communication'],
          weaknesses: Array.isArray(parsed.weaknesses)
            ? parsed.weaknesses
            : ['Need more detail'],
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions
            : ['Expand your answer more clearly'],
        };
      } catch {
        return {
          overallScore: 7,
          strengths: ['Good communication'],
          weaknesses: ['Need more detail'],
          suggestions: ['Expand your answer more clearly'],
        };
      }
    } catch (error) {
      console.error('AI analyze error:', error);

      return {
        overallScore: 6,
        strengths: ['Basic answer'],
        weaknesses: ['Lack of detail'],
        suggestions: ['Expand your ideas with more examples'],
      };
    }
  }

  async saveSoloRecordingAnalysis(params: {
    soloRecordingId: number;
    transcript: string;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }) {
    const {
      soloRecordingId,
      transcript,
      overallScore,
      strengths,
      weaknesses,
      suggestions,
    } = params;

    return this.prisma.aiAnalysis.upsert({
      where: {
        soloRecordingId,
      },
      update: {
        transcript,
        overallScore,
        strengths,
        weaknesses,
        suggestions,
        processedAt: new Date(),
      },
      create: {
        soloRecordingId,
        transcript,
        overallScore,
        strengths,
        weaknesses,
        suggestions,
      },
    });
  }
}
