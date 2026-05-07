import { Test, TestingModule } from '@nestjs/testing';
import { CodingService } from './coding.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubmissionStatus, Difficulty, QuestionType } from '@prisma/client';

import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';

describe('CodingService', () => {
  let service: CodingService;
  let prisma: DeepMocked<PrismaService>;
  let executionQueue: DeepMocked<Queue>;

  const mockQuestion = {
    id: 1,
    questionId: 1,
    title: 'Two Sum',
    slug: 'two-sum',

    testCases: [
      {
        id: 101,
        input: '1 2',
        expectedOutput: '3',
        isHidden: false,
        points: 1,
      },
      {
        id: 102,
        input: '5 5',
        expectedOutput: '10',
        isHidden: true,
        points: 2,
      },
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
    const langId = '71';
    const code = 'print(1+2)';

    it('should throw BadRequestException if question not found', async () => {
      prisma.codingQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.submitCode(userId, 999, langId, code),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no testcase exists', async () => {
      prisma.codingQuestion.findUnique.mockResolvedValue({
        ...mockQuestion,
        testCases: [],
      } as any);

      await expect(service.submitCode(userId, 1, langId, code)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create submission and push queue successfully', async () => {
      prisma.codingQuestion.findUnique.mockResolvedValue(mockQuestion as any);

      const mockSubmission = {
        id: 500,
        status: SubmissionStatus.PENDING,
      };

      prisma.codeSubmission.create.mockResolvedValue(mockSubmission as any);

      executionQueue.add.mockResolvedValue({} as any);

      const result = await service.submitCode(userId, 1, langId, code);

      expect(prisma.codeSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          codingQuestionId: 1,
          languageId: langId,
          language: 'python',
          sourceCode: code,
          status: SubmissionStatus.PENDING,
          totalTestCases: 2,
        }),
      });

      expect(executionQueue.add).toHaveBeenCalledWith(
        'execute-code',
        expect.objectContaining({
          submissionId: 500,
          languageId: 71,
          sourceCode: code,

          testCases: expect.arrayContaining([
            expect.objectContaining({
              input: '1 2',
              expectedOutput: '3',
            }),
          ]),
        }),
      );

      expect(result).toEqual(mockSubmission);
    });
  });

  describe('getSubmissionById', () => {
    it('should query submission with question info', async () => {
      prisma.codeSubmission.findUnique.mockResolvedValue({} as any);

      await service.getSubmissionById(1);

      expect(prisma.codeSubmission.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },

        include: {
          codingQuestion: {
            include: {
              question: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('getCodingQuestionBySlug', () => {
    it('should return question with submissions if userId exists', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,

        codingQuestion: {
          testCases: [],
          submissions: [],
        },
      } as any);

      const slug = 'two-sum';
      const userId = 1;

      await service.getCodingQuestionBySlug(slug, userId);

      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: {
          slug,
          type: QuestionType.CODING,
        },

        include: {
          codingQuestion: {
            include: {
              testCases: {
                orderBy: {
                  order: 'asc',
                },
              },

              submissions: {
                where: {
                  userId,
                },

                orderBy: {
                  submittedAt: 'desc',
                },

                take: 5,
              },
            },
          },
        },
      });
    });

    it('should not include submissions if userId missing', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,

        codingQuestion: {
          testCases: [],
        },
      } as any);

      await service.getCodingQuestionBySlug('some-slug');

      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'some-slug',
          type: QuestionType.CODING,
        },

        include: {
          codingQuestion: {
            include: {
              testCases: {
                orderBy: {
                  order: 'asc',
                },
              },

              submissions: false,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if question missing', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.getCodingQuestionBySlug('invalid-slug'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCodingQuestion', () => {
    it('should create coding question with default values', async () => {
      const dto: CreateCodingQuestionDto = {
        title: 'New Prob',
        slug: 'new-prob',
        description: 'Desc',
        difficulty: Difficulty.HARD,
      } as any;

      prisma.question.create.mockResolvedValue({} as any);

      await service.createCodingQuestion(dto);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: {
          title: 'New Prob',
          slug: 'new-prob',

          difficulty: Difficulty.HARD,

          type: QuestionType.CODING,

          isPublished: true,

          codingQuestion: {
            create: {
              description: 'Desc',

              constraints: undefined,

              timeLimit: 2000,

              memoryLimit: 256000,
            },
          },
        },

        include: {
          codingQuestion: true,
        },
      });
    });
  });

  describe('addTestCase', () => {
    it('should create testcase with default values', async () => {
      const qId = 1;

      const dto: CreateTestCaseDto = {
        input: 'in',
        expectedOutput: 'out',
      } as any;

      prisma.testCase.create.mockResolvedValue({} as any);

      await service.addTestCase(qId, dto);

      expect(prisma.testCase.create).toHaveBeenCalledWith({
        data: {
          codingQuestionId: qId,

          input: 'in',

          expectedOutput: 'out',

          isSample: false,

          isHidden: false,

          points: 1,

          order: 0,

          explanation: undefined,
        },
      });
    });
  });

  describe('getAllQuestions', () => {
    it('should query all published coding questions', async () => {
      prisma.question.findMany.mockResolvedValue([] as any);

      await service.getAllQuestions();

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          type: QuestionType.CODING,
        },

        include: {
          codingQuestion: {
            include: {
              testCases: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
