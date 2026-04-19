import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysisService } from './ai-analysis.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import Groq from 'groq-sdk';

// Mock các thư viện external
jest.mock('axios');
jest.mock('fs');
jest.mock('groq-sdk');

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;
  let prismaService: DeepMocked<PrismaService>;

  const mockGroq = {
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    // Inject mockGroq mỗi khi instance Groq được tạo
    (Groq as unknown as jest.Mock).mockImplementation(() => mockGroq);
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalysisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GROQ_API_KEY: 'fake-groq-key',
                GROQ_STT_MODEL: 'whisper-large-v3-turbo',
                GROQ_MODEL: 'llama-3.3-70b-versatile',
              };
              return config[key] ?? null;
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

  describe('getSoloRecordingAnalysis', () => {
    it('should call prisma findUnique', async () => {
      prismaService.aiAnalysis.findUnique.mockResolvedValue(null);
      await service.getSoloRecordingAnalysis(1);
      expect(prismaService.aiAnalysis.findUnique).toHaveBeenCalledWith({
        where: { soloRecordingId: 1 },
        include: { soloRecording: true },
      });
    });
  });

  describe('transcribeFromAudioUrl', () => {
    it('should return transcript when everything succeeds', async () => {
      // Mock axios download
      (axios.get as jest.Mock).mockResolvedValue({
        data: Buffer.from('fake-audio-data'),
      });

      // Mock file system
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 }); // size > 0
      (fs.createReadStream as jest.Mock).mockReturnValue('mock-read-stream');
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      // Mock Groq API
      mockGroq.audio.transcriptions.create.mockResolvedValue({
        text: 'Xin chào, đây là câu trả lời phỏng vấn.',
      });

      const result = await service.transcribeFromAudioUrl(
        'http://example.com/audio.webm',
      );

      expect(result).toBe('Xin chào, đây là câu trả lời phỏng vấn.');
      expect(axios.get).toHaveBeenCalled();
      expect(mockGroq.audio.transcriptions.create).toHaveBeenCalledWith({
        file: 'mock-read-stream',
        model: 'whisper-large-v3-turbo',
        language: 'vi',
        temperature: 0,
      });
      // Đảm bảo file rác luôn bị xóa ở finally
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should throw BadRequestException if downloaded file is empty (0 bytes)', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('') });
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 0 }); // size = 0
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      await expect(
        service.transcribeFromAudioUrl('http://example.com/audio.webm'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transcript is empty', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('data') });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      (fs.createReadStream as jest.Mock).mockReturnValue('stream');

      mockGroq.audio.transcriptions.create.mockResolvedValue({ text: '   ' }); // Empty text

      await expect(
        service.transcribeFromAudioUrl('http://example.com/audio.webm'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateFeedback', () => {
    it('should return parsed feedback when Groq returns valid JSON', async () => {
      const mockJsonResponse = {
        overallScore: 8,
        strengths: ['Điểm mạnh 1', 'Điểm mạnh 2', 'Điểm mạnh 3'],
        weaknesses: ['Điểm yếu 1', 'Điểm yếu 2', 'Điểm yếu 3'],
        suggestions: ['Gợi ý 1', 'Gợi ý 2', 'Gợi ý 3'],
      };

      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: `\`\`\`json\n${JSON.stringify(mockJsonResponse)}\n\`\`\``,
            },
          },
        ],
      });

      const result = await service.generateFeedback({
        transcript: 'Em đã có kinh nghiệm làm Nodejs...',
        question: 'Giới thiệu bản thân',
      });

      expect(result.overallScore).toBe(8);
      expect(result.strengths[0]).toBe('Điểm mạnh 1');
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });

    it('should return fallback fallback values when Groq returns invalid JSON', async () => {
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Đây không phải là JSON' } }],
      });

      const result = await service.generateFeedback({
        transcript: 'Em đã có kinh nghiệm làm Nodejs...',
        question: 'Giới thiệu bản thân',
      });

      // Kiểm tra các giá trị fallback (có trong block catch parseError của service)
      expect(result.overallScore).toBe(5);
      expect(result.weaknesses[0]).toContain('chưa được chuẩn hóa hoàn toàn');
    });

    it('should throw BadRequestException if transcript is empty', async () => {
      await expect(
        service.generateFeedback({ transcript: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('saveSoloRecordingAnalysis', () => {
    it('should upsert aiAnalysis', async () => {
      prismaService.aiAnalysis.upsert.mockResolvedValue({ id: 1 } as any);

      await service.saveSoloRecordingAnalysis({
        soloRecordingId: 1,
        transcript: 'test',
        overallScore: 7,
        strengths: ['s1'],
        weaknesses: ['w1'],
        suggestions: ['su1'],
      });

      expect(prismaService.aiAnalysis.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { soloRecordingId: 1 },
        }),
      );
    });
  });
});
