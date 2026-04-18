// import { Test, TestingModule } from '@nestjs/testing';
// import { AiAnalysisService } from './ai-analysis.service';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../../prisma/prisma.service';
// import { createMock, DeepMocked } from '@golevelup/ts-jest';
// // import axios from 'axios';
// // import * as fs from 'fs';
// import Groq from 'groq-sdk';

// jest.mock('axios');
// jest.mock('fs');
// jest.mock('groq-sdk');

// describe('AiAnalysisService', () => {
//   let service: AiAnalysisService;
//   let prismaService: DeepMocked<PrismaService>;

//   const mockGroq = {
//     audio: {
//       transcriptions: {
//         create: jest.fn(),
//       },
//     },
//     chat: {
//       completions: {
//         create: jest.fn(),
//       },
//     },
//   };

//   beforeEach(async () => {
//     (Groq as unknown as jest.Mock).mockImplementation(() => mockGroq);

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AiAnalysisService,
//         {
//           provide: ConfigService,
//           useValue: {
//             get: jest.fn((key: string) => {
//               const config: Record<string, string> = {
//                 GROQ_API_KEY: 'fake-groq-key',
//                 GROQ_STT_MODEL: 'whisper-large-v3-turbo',
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

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   // describe('transcribeFromAudioUrl', () => {
//   //   it('should return transcript when Groq STT succeeds', async () => {
//   //     (axios.get as jest.Mock).mockResolvedValue({
//   //       data: Buffer.from('audio-data'),
//   //     });

//   //     (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
//   //     (fs.existsSync as jest.Mock).mockReturnValue(true);
//   //     (fs.statSync as jest.Mock).mockReturnValue({ size: 1234 });
//   //     (fs.createReadStream as jest.Mock).mockReturnValue('mock-stream');
//   //     (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

//   //     mockGroq.audio.transcriptions.create.mockResolvedValue({
//   //       text: 'Xin chào interviewer',
//   //     });

//   //     const result = await service.transcribeFromAudioUrl(
//   //       'http://example.com/audio.webm',
//   //     );

//   //     expect(result).toBe('Xin chào interviewer');
//   //     expect(mockGroq.audio.transcriptions.create).toHaveBeenCalledWith({
//   //       file: 'mock-stream',
//   //       model: 'whisper-large-v3-turbo',
//   //       language: 'vi',
//   //       temperature: 0,
//   //     });
//   //   });

//   //   it('should throw if transcript is empty', async () => {
//   //     (axios.get as jest.Mock).mockResolvedValue({
//   //       data: Buffer.from('audio-data'),
//   //     });

//   //     (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
//   //     (fs.existsSync as jest.Mock).mockReturnValue(true);
//   //     (fs.statSync as jest.Mock).mockReturnValue({ size: 1234 });
//   //     (fs.createReadStream as jest.Mock).mockReturnValue('mock-stream');
//   //     (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

//   //     mockGroq.audio.transcriptions.create.mockResolvedValue({
//   //       text: '',
//   //     });

//   //     await expect(
//   //       service.transcribeFromAudioUrl('http://example.com/audio.webm'),
//   //     ).rejects.toThrow('Transcript rỗng');
//   //   });
//   // });

//   // describe('generateFeedback', () => {
//   //   it('should return parsed feedback when AI returns valid JSON', async () => {
//   //     mockGroq.chat.completions.create.mockResolvedValue({
//   //       choices: [
//   //         {
//   //           message: {
//   //             content: JSON.stringify({
//   //               overallScore: 8,
//   //               strengths: ['Ý 1', 'Ý 2', 'Ý 3'],
//   //               weaknesses: ['Điểm yếu 1', 'Điểm yếu 2', 'Điểm yếu 3'],
//   //               suggestions: ['Gợi ý 1', 'Gợi ý 2', 'Gợi ý 3'],
//   //             }),
//   //           },
//   //         },
//   //       ],
//   //     });

//   //     const result = await service.generateFeedback({
//   //       transcript: 'Em là lập trình viên backend...',
//   //       question: 'Hãy giới thiệu về bản thân',
//   //     });

//   //     expect(result.overallScore).toBe(8);
//   //     expect(result.strengths).toHaveLength(3);
//   //   });
//   // });

//   // describe('saveSoloRecordingAnalysis', () => {
//   //   it('should upsert aiAnalysis', async () => {
//   //     prismaService.aiAnalysis.upsert.mockResolvedValue({
//   //       id: 1,
//   //     } as any);

//   //     await service.saveSoloRecordingAnalysis({
//   //       soloRecordingId: 1,
//   //       transcript: 'test transcript',
//   //       overallScore: 7,
//   //       strengths: ['a', 'b', 'c'],
//   //       weaknesses: ['d', 'e', 'f'],
//   //       suggestions: ['g', 'h', 'i'],
//   //     });

//   //     expect(prismaService.aiAnalysis.upsert).toHaveBeenCalled();
//   //   });
//   // });
// });
