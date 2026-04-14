import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import OpenAI from 'openai';

const execFileAsync = promisify(execFile);

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
  }

  private getExtensionFromUrl(url: string): string {
    const cleanUrl = url.split('?')[0];
    const ext = path.extname(cleanUrl).replace('.', '').toLowerCase();
    return ext || 'webm';
  }

  private async downloadAudioToTempFile(audioUrl: string): Promise<string> {
    const ext = this.getExtensionFromUrl(audioUrl);
    const inputPath = path.join(os.tmpdir(), `solo-input-${Date.now()}.${ext}`);

    const response = await axios.get<ArrayBuffer>(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    fs.writeFileSync(inputPath, Buffer.from(response.data));
    return inputPath;
  }

  private async convertToWav(inputPath: string): Promise<string> {
    if (!ffmpegPath) {
      throw new InternalServerErrorException('Không tìm thấy ffmpeg-static');
    }

    const outputPath = path.join(os.tmpdir(), `solo-output-${Date.now()}.wav`);

    await execFileAsync(ffmpegPath, [
      '-y',
      '-i',
      inputPath,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-sample_fmt',
      's16',
      outputPath,
    ]);

    return outputPath;
  }

  async transcribeFromAudioUrl(audioUrl: string): Promise<string> {
    const speechKey = this.configService.get<string>('AZURE_SPEECH_KEY');
    const speechRegion = this.configService.get<string>('AZURE_SPEECH_REGION');

    if (!speechKey || !speechRegion) {
      throw new InternalServerErrorException(
        'Thiếu AZURE_SPEECH_KEY hoặc AZURE_SPEECH_REGION trong .env',
      );
    }

    let inputPath: string | null = null;
    let wavPath: string | null = null;

    try {
      inputPath = await this.downloadAudioToTempFile(audioUrl);
      wavPath = await this.convertToWav(inputPath);

      const wavBuffer = fs.readFileSync(wavPath);

      const speechConfig = sdk.SpeechConfig.fromSubscription(
        speechKey,
        speechRegion,
      );

      speechConfig.speechRecognitionLanguage = 'vi-VN';

      const audioConfig = sdk.AudioConfig.fromWavFileInput(wavBuffer);
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      const result = await new Promise<sdk.SpeechRecognitionResult>(
        (resolve, reject) => {
          recognizer.recognizeOnceAsync(
            (res: sdk.SpeechRecognitionResult) => {
              recognizer.close();
              resolve(res);
            },
            (err: string) => {
              recognizer.close();
              reject(new Error(err));
            },
          );
        },
      );

      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        const transcript = result.text?.trim() ?? '';
        if (!transcript) {
          throw new BadRequestException('Transcript rỗng');
        }
        return transcript;
      }

      if (result.reason === sdk.ResultReason.NoMatch) {
        throw new BadRequestException('Không nhận diện được giọng nói');
      }

      throw new InternalServerErrorException(
        `Azure Speech thất bại, reason=${String(result.reason)}`,
      );
    } catch (error) {
      console.error('Azure STT error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Không thể chuyển audio sang text bằng Azure Speech',
      );
    } finally {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    }
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

Question:
${question || 'Tell me about yourself'}

Answer:
${transcript}

Return ONLY valid JSON in this format:
{
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}
`.trim();

    try {
      const model =
        this.configService.get<string>('OPENROUTER_MODEL') || 'openrouter/free';

      const response = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content ?? '';

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
      where: { soloRecordingId },
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
