// import { Test, TestingModule } from '@nestjs/testing';
// import { AiAnalysisService } from './ai-analysis.service';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../../prisma/prisma.service';
// import { createMock, DeepMocked } from '@golevelup/ts-jest';
// import { BadRequestException } from '@nestjs/common';
// import Groq from 'groq-sdk';

// // Chỉ cần mock Groq, không cần mock axios và fs nữa vì đã bỏ Audio STT
// jest.mock('groq-sdk');

// describe('AiAnalysisService', () => {
//   let service: AiAnalysisService;
//   let prismaService: DeepMocked<PrismaService>;

//   const mockGroq = {
//     chat: {
//       completions: {
//         create: jest.fn(),
//       },
//     },
//   };

//   beforeEach(async () => {
//     // Inject mockGroq mỗi khi instance Groq được tạo
//     (Groq as unknown as jest.Mock).mockImplementation(() => mockGroq);
//     jest.clearAllMocks();

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AiAnalysisService,
//         {
//           provide: ConfigService,
//           useValue: {
//             get: jest.fn((key: string) => {
//               const config: Record<string, string> = {
//                 GROQ_API_KEY: 'fake-groq-key',
//                 GROQ_MODEL: 'llama-3.3-70b-versatile',
//               };
//               return config[key] ?? null;
//             }),
//           },
//         },
//         {
//           provide: PrismaService,
//           useValue: createMock<PrismaService>(),
//         },
//       ],
//     }).compile();

//     service = module.get<AiAnalysisService>(AiAnalysisService);
//     prismaService = module.get(PrismaService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('getSoloRecordingAnalysis', () => {
//     it('should call prisma findUnique', async () => {
//       prismaService.aiAnalysis.findUnique.mockResolvedValue(null);
//       await service.getSoloRecordingAnalysis(1);
//       expect(prismaService.aiAnalysis.findUnique).toHaveBeenCalledWith({
//         where: { soloRecordingId: 1 },
//         include: { soloRecording: true },
//       });
//     });
//   });

//   describe('generateFeedback', () => {
//     it('should return parsed feedback when Groq returns valid JSON', async () => {
//       const mockJsonResponse = {
//         overallScore: 8,
//         strengths: ['Điểm mạnh 1', 'Điểm mạnh 2', 'Điểm mạnh 3'],
//         weaknesses: ['Điểm yếu 1', 'Điểm yếu 2', 'Điểm yếu 3'],
//         suggestions: ['Gợi ý 1', 'Gợi ý 2', 'Gợi ý 3'],
//       };

//       mockGroq.chat.completions.create.mockResolvedValue({
//         choices: [
//           {
//             message: {
//               content: `\`\`\`json\n${JSON.stringify(mockJsonResponse)}\n\`\`\``,
//             },
//           },
//         ],
//       });

//       const result = await service.generateFeedback({
//         transcript: 'Em đã có kinh nghiệm làm Nodejs...',
//         question: 'Giới thiệu bản thân',
//       });

//       expect(result.overallScore).toBe(8);
//       expect(result.strengths[0]).toBe('Điểm mạnh 1');
//       expect(mockGroq.chat.completions.create).toHaveBeenCalled();
//     });

//     it('should return fallback values when Groq returns invalid JSON', async () => {
//       mockGroq.chat.completions.create.mockResolvedValue({
//         choices: [{ message: { content: 'Đây không phải là JSON' } }],
//       });

//       const result = await service.generateFeedback({
//         transcript: 'Em đã có kinh nghiệm làm Nodejs...',
//         question: 'Giới thiệu bản thân',
//       });

//       // Kiểm tra các giá trị fallback (có trong block catch parseError của service)
//       expect(result.overallScore).toBe(5);
//       expect(result.weaknesses[0]).toContain('chưa được chuẩn hóa hoàn toàn');
//     });

//     it('should throw BadRequestException if transcript is empty', async () => {
//       await expect(
//         service.generateFeedback({ transcript: '   ' }),
//       ).rejects.toThrow(BadRequestException);
//     });
//   });

//   describe('saveSoloRecordingAnalysis', () => {
//     it('should upsert aiAnalysis', async () => {
//       // Mock object trả về của Prisma để tránh lỗi Type Strict của TypeScript
//       const mockAiAnalysis = {
//         id: 1,
//         sessionId: null,
//         soloRecordingId: 1,
//         transcript: 'test',
//         strengths: ['s1'],
//         weaknesses: ['w1'],
//         suggestions: ['su1'],
//         overallScore: 7,
//         processedAt: new Date(),
//       };

//       prismaService.aiAnalysis.upsert.mockResolvedValue(mockAiAnalysis);

//       await service.saveSoloRecordingAnalysis({
//         soloRecordingId: 1,
//         transcript: 'test',
//         overallScore: 7,
//         strengths: ['s1'],
//         weaknesses: ['w1'],
//         suggestions: ['su1'],
//       });

//       expect(prismaService.aiAnalysis.upsert).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: { soloRecordingId: 1 },
//         }),
//       );
//     });
//   });
// });
