import { Test, TestingModule } from '@nestjs/testing';
import { CodingService } from './coding.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BadRequestException } from '@nestjs/common';
import { SubmissionStatus, Difficulty } from '@prisma/client';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';

 

describe('CodingService', () => {
  let service: CodingService;
  let prisma: DeepMocked<PrismaService>;
  let executionQueue: DeepMocked<Queue>;

  const mockQuestion = {
    id: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    testCases: [
      { id: 101, input: '1 2', expectedOutput: '3' },
      { id: 102, input: '5 5', expectedOutput: '10' },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodingService,
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
        {
          provide: getQueueToken('code-execution'),
          useValue: createMock<Queue>(),
        },
      ],
    }).compile();

    service = module.get<CodingService>(CodingService);
    prisma = module.get(PrismaService);
    executionQueue = module.get(getQueueToken('code-execution'));
  });

  describe('submitCode', () => {
    const userId = 1;
    const langId = '71'; // Python
    const code = 'print(1+2)';

    it('nên ném lỗi BadRequest nếu không tìm thấy câu hỏi', async () => {
      (
        prisma.codingQuestion.findUnique as unknown as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.submitCode(userId, 999, langId, code),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên ném lỗi BadRequest nếu câu hỏi không có test case', async () => {
      (
        prisma.codingQuestion.findUnique as unknown as jest.Mock
      ).mockResolvedValue({
        ...mockQuestion,
        testCases: [],
      });

      await expect(service.submitCode(userId, 1, langId, code)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('nên tạo submission và push vào queue thành công', async () => {
      (
        prisma.codingQuestion.findUnique as unknown as jest.Mock
      ).mockResolvedValue(mockQuestion);

      const mockSubmission = { id: 500, status: SubmissionStatus.PENDING };
      (prisma.codeSubmission.create as unknown as jest.Mock).mockResolvedValue(
        mockSubmission,
      );

      const result = await service.submitCode(userId, 1, langId, code);

      // 1. Kiểm tra lưu DB
      expect(prisma.codeSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          language: 'python',
          status: SubmissionStatus.PENDING,
          totalTestCases: 2,
        }),
      });

      // 2. Kiểm tra đẩy vào BullMQ
      expect(executionQueue.add).toHaveBeenCalledWith(
        'execute-code',
        expect.objectContaining({
          submissionId: 500,
          testCases: expect.arrayContaining([
            expect.objectContaining({ input: '1 2' }),
          ]),
        }),
      );

      expect(result).toEqual(mockSubmission);
    });
  });

  describe('getCodingQuestionBySlug', () => {
    it('nên trả về question kèm submissions nếu có userId', async () => {
      const slug = 'two-sum';
      const userId = 1;

      await service.getCodingQuestionBySlug(slug, userId);

      expect(prisma.codingQuestion.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: expect.objectContaining({
          submissions: {
            where: { userId },
            orderBy: { submittedAt: 'desc' },
            take: 5,
          },
        }),
      });
    });

    it('không nên include submissions nếu không truyền userId', async () => {
      await service.getCodingQuestionBySlug('some-slug');

      expect(prisma.codingQuestion.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            submissions: false,
          }),
        }),
      );
    });
  });

  describe('createCodingQuestion', () => {
    it('nên gọi prisma create với các giá trị mặc định cho timeLimit và memoryLimit', async () => {
      const dto = {
        title: 'New Prob',
        slug: 'new-prob',
        description: 'Desc',
        difficulty: Difficulty.HARD,
      };

      await service.createCodingQuestion(dto as CreateCodingQuestionDto);

      expect(prisma.codingQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timeLimit: 2000,
          memoryLimit: 256000,
          isPublished: true,
        }),
      });
    });
  });

  describe('addTestCase', () => {
    it('nên tạo test case với các giá trị default', async () => {
      const qId = 1;
      const dto = { input: 'in', expectedOutput: 'out' };

      await service.addTestCase(qId, dto as CreateTestCaseDto);

      expect(prisma.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          codingQuestionId: qId,
          isSample: false,
          points: 1,
        }),
      });
    });
  });
});
