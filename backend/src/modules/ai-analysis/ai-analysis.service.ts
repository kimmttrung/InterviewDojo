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
import Groq from 'groq-sdk';

const execFileAsync = promisify(execFile);

type FeedbackResult = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

@Injectable()
export class AiAnalysisService {
  private readonly groq: Groq;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY');
    }

    this.groq = new Groq({
      apiKey,
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

  async getSoloRecordingAnalysis(recordingId: number) {
    return this.prisma.aiAnalysis.findUnique({
      where: {
        soloRecordingId: recordingId,
      },
      include: {
        soloRecording: true,
      },
    });
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
      console.log('audioUrl:', audioUrl);

      inputPath = await this.downloadAudioToTempFile(audioUrl);
      console.log('inputPath:', inputPath);
      console.log(
        'input size:',
        inputPath && fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0,
      );

      wavPath = await this.convertToWav(inputPath);
      console.log('wavPath:', wavPath);
      console.log(
        'wav size:',
        wavPath && fs.existsSync(wavPath) ? fs.statSync(wavPath).size : 0,
      );

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

      console.log('Azure result reason:', result.reason);
      console.log('Azure result text:', result.text);
      console.log('Azure result errorDetails:', result.errorDetails);

      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        const transcript = result.text?.trim() ?? '';
        if (!transcript) {
          throw new BadRequestException('Transcript rỗng');
        }
        return transcript;
      }

      if (result.reason === sdk.ResultReason.NoMatch) {
        console.error('Azure NoMatch:', {
          reason: result.reason,
          text: result.text,
          errorDetails: result.errorDetails,
        });
        throw new BadRequestException('Không nhận diện được giọng nói');
      }

      throw new InternalServerErrorException(
        `Azure Speech thất bại, reason=${String(result.reason)}, errorDetails=${result.errorDetails ?? 'N/A'}`,
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
  Bạn là một Senior Software Engineer có hơn 10 năm kinh nghiệm phỏng vấn kỹ thuật, đánh giá ứng viên và hướng dẫn người mới.

  Nhiệm vụ của bạn:
  - Đánh giá câu trả lời của ứng viên như một interviewer giàu kinh nghiệm.
  - Nhận xét phải thực tế, sắc bén, có chiều sâu và mang tính hướng dẫn.
  - Không nhận xét chung chung, không khen cho có, không chấm điểm dễ dãi.
  - Mỗi nhận xét phải bám sát nội dung câu trả lời của ứng viên.

  Câu hỏi phỏng vấn:
  ${question || 'Hãy giới thiệu về bản thân'}

  Câu trả lời của ứng viên:
  ${transcript}

  Tiêu chí đánh giá:
  1. Mức độ trả lời đúng trọng tâm câu hỏi
  2. Độ rõ ràng, mạch lạc và logic
  3. Khả năng diễn đạt và thuyết phục
  4. Mức độ cụ thể, có ví dụ hay không
  5. Tư duy kỹ thuật hoặc tư duy giải quyết vấn đề (nếu có)

  Chấm điểm overallScore theo thang 0 đến 10, chia thành đúng 4 mức:
  - Mức 1 (0 đến 2): Rất yếu — câu trả lời lạc đề, rời rạc, rất khó hiểu hoặc gần như không trả lời được câu hỏi
  - Mức 2 (3 đến 5): Trung bình yếu — có ý liên quan nhưng trả lời còn mơ hồ, thiếu logic, thiếu ví dụ, chưa đủ thuyết phục
  - Mức 3 (6 đến 8): Khá tốt — trả lời tương đối rõ, có logic, có nội dung phù hợp, nhưng vẫn còn điểm cần cải thiện
  - Mức 4 (9 đến 10): Rất tốt — trả lời rõ ràng, chặt chẽ, có chiều sâu, có ví dụ phù hợp, thể hiện tư duy tốt và sự chuyên nghiệp

  Yêu cầu đầu ra:
  - strengths: từ 3 đến 5 ý
  - weaknesses: từ 3 đến 5 ý
  - suggestions: từ 3 đến 5 ý
  - Mỗi ý phải cụ thể, không được quá chung chung
  - Phải viết hoàn toàn bằng tiếng Việt
  - Không dùng các câu kiểu như "Cần cải thiện giao tiếp" nếu không nói rõ cần cải thiện như thế nào
  - Nếu câu trả lời ngắn, mơ hồ, thiếu ví dụ thì không được chấm điểm cao
  - Nếu transcript có dấu hiệu nhận dạng giọng nói sai hoặc nội dung không rõ, phải nêu rõ điều đó trong phần weaknesses hoặc suggestions
  - overallScore phải là số nguyên từ 0 đến 10

  Chỉ trả về DUY NHẤT JSON hợp lệ theo đúng format sau:
  {
    "overallScore": number,
    "strengths": string[],
    "weaknesses": string[],
    "suggestions": string[]
  }
  `.trim();

    try {
      const model = 'llama3-70b-8192';

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là một Senior Software Engineer có nhiều năm kinh nghiệm phỏng vấn kỹ thuật. Luôn trả lời bằng tiếng Việt. Luôn đánh giá thẳng thắn, cụ thể, thực tế, có chiều sâu và mang tính hướng dẫn. Luôn trả về JSON hợp lệ đúng format mà người dùng yêu cầu.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? '';
      console.log('AI raw response:', text);

      try {
        const cleanText = text.replace(/```json|```/gi, '').trim();

        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');

        if (start === -1 || end === -1 || end <= start) {
          throw new Error('Không tìm thấy JSON hợp lệ trong phản hồi của AI');
        }

        const jsonText = cleanText.slice(start, end + 1);
        console.log('AI cleaned JSON:', jsonText);

        const parsed = JSON.parse(jsonText) as FeedbackResult;

        const rawScore = Number(parsed.overallScore ?? 5);
        const score = Math.round(Math.max(0, Math.min(10, rawScore)));

        const normalizeItems = (
          items: unknown,
          fallback: string[],
        ): string[] => {
          if (!Array.isArray(items)) return fallback;

          const cleaned = items
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .slice(0, 5);

          if (cleaned.length >= 3) return cleaned;

          return fallback;
        };

        return {
          overallScore: score,
          strengths: normalizeItems(parsed.strengths, [
            'Câu trả lời có liên quan đến nội dung của câu hỏi.',
            'Ứng viên thể hiện được một vài điểm mạnh cá nhân tương đối rõ.',
            'Cách trả lời cho thấy có nhận thức nhất định về bản thân và công việc.',
          ]),
          weaknesses: normalizeItems(parsed.weaknesses, [
            'Câu trả lời vẫn còn thiếu chiều sâu ở một số ý quan trọng.',
            'Cách diễn đạt chưa thật sự chặt chẽ và mạch lạc ở toàn bộ câu trả lời.',
            'Chưa đưa ra đủ ví dụ cụ thể để tăng độ thuyết phục.',
          ]),
          suggestions: normalizeItems(parsed.suggestions, [
            'Nên trả lời theo cấu trúc rõ ràng hơn, ví dụ mở ý, triển khai ý và chốt ý.',
            'Nên bổ sung ví dụ thực tế từ dự án, công việc hoặc trải nghiệm cá nhân.',
            'Nên diễn đạt ngắn gọn hơn ở từng ý nhưng làm rõ được trọng tâm.',
          ]),
        };
      } catch (parseError) {
        console.error('Parse AI JSON failed:', parseError);

        return {
          overallScore: 5,
          strengths: [
            'Câu trả lời có liên quan đến câu hỏi được đặt ra.',
            'Ứng viên đã cố gắng trình bày quan điểm cá nhân.',
            'Nội dung có thể hiện một số ý phù hợp với bối cảnh phỏng vấn.',
          ],
          weaknesses: [
            'Kết quả phản hồi từ AI chưa được chuẩn hóa hoàn toàn về định dạng.',
            'Nội dung phân tích chưa được trích xuất đầy đủ do lỗi parse JSON.',
            'Một số nhận xét chi tiết có thể đã bị mất trong quá trình xử lý kết quả.',
          ],
          suggestions: [
            'Nên thử lại để hệ thống sinh phản hồi ổn định và đầy đủ hơn.',
            'Có thể ghi âm rõ ràng hơn để tăng chất lượng transcript đầu vào.',
            'Nên tiếp tục trả lời theo cấu trúc rõ ràng và có ví dụ minh họa cụ thể.',
          ],
        };
      }
    } catch (error) {
      console.error('AI analyze error:', error);

      return {
        overallScore: 4,
        strengths: [
          'Ứng viên đã đưa ra câu trả lời thay vì bỏ trống.',
          'Nội dung vẫn có một phần liên quan đến câu hỏi.',
          'Có cơ sở để tiếp tục cải thiện chất lượng câu trả lời ở lần sau.',
        ],
        weaknesses: [
          'Hệ thống AI chưa phân tích sâu được câu trả lời trong lần này.',
          'Kết quả hiện tại có thể chưa phản ánh đầy đủ chất lượng thực tế của ứng viên.',
          'Phản hồi chi tiết bị giới hạn do lỗi trong quá trình gọi mô hình.',
        ],
        suggestions: [
          'Hãy thử lại với câu trả lời rõ ràng, mạch lạc và chậm hơn.',
          'Nên bổ sung ví dụ thực tế để tăng tính thuyết phục cho câu trả lời.',
          'Nên kiểm tra chất lượng âm thanh để transcript chính xác hơn.',
        ],
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
