import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Difficulty, QuestionType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: DeepMocked<PrismaService>;

  const mockDate = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return formatted questions with meta', async () => {
      const query: GetQuestionsDto = {
        page: 1,
        limit: 10,
      };

      prisma.question.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'Two Sum',
          slug: 'two-sum',
          difficulty: Difficulty.EASY,
          type: QuestionType.CODING,
          isPublished: true,
          createdAt: mockDate,

          categories: [
            {
              category: {
                name: 'Algorithm',
              },
            },
          ],

          companies: [
            {
              company: {
                name: 'Google',
              },
            },
          ],

          jobRoles: [
            {
              jobRole: {
                name: 'Backend Developer',
              },
            },
          ],

          codingQuestion: {
            description: 'Solve two sum',
          },

          theoryQuestion: null,
        },
      ] as any);

      prisma.question.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);

      expect(result.data[0]).toEqual({
        id: 1,
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: Difficulty.EASY,
        questionType: QuestionType.CODING,
        isPublished: true,
        createdAt: mockDate,
        description: 'Solve two sum',
        categories: ['Algorithm'],
        companies: ['Google'],
        jobRoles: ['Backend Developer'],
      });

      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should format keyword search correctly', async () => {
      const query: GetQuestionsDto = {
        keyword: 'nest js',
      };

      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                title: {
                  search: 'nest & js',
                },
              },
              {
                title: {
                  contains: 'nest js',
                  mode: 'insensitive',
                },
              },
            ],
          }),
        }),
      );
    });

    it('should filter by difficulty and type', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);

      await service.findAll({
        difficulty: Difficulty.HARD,
        questionType: QuestionType.CODING,
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: Difficulty.HARD,
            type: QuestionType.CODING,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return coding question detail', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        title: 'Two Sum',
        type: QuestionType.CODING,
        isPublished: true,

        categories: [
          {
            category: {
              name: 'Algorithm',
            },
          },
        ],

        companies: [
          {
            company: {
              name: 'Google',
            },
          },
        ],

        jobRoles: [
          {
            jobRole: {
              name: 'Backend Developer',
            },
          },
        ],

        theoryQuestion: null,

        codingQuestion: {
          description: 'Solve two sum',
          testCases: [],
        },
      } as any);

      const result = await service.findOne(1);

      expect(result.isCodingQuestion).toBe(true);
      expect(result.categories).toEqual(['Algorithm']);
      expect(result.companies).toEqual(['Google']);
      expect(result.jobRoles).toEqual(['Backend Developer']);
    });

    it('should throw NotFoundException if question not found', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create coding question with relations', async () => {
      const dto: CreateQuestionDto = {
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: Difficulty.EASY,
        type: QuestionType.CODING,

        categoryIds: [1],
        companyIds: [2],
        jobRoleIds: [3],

        codingData: {
          description: 'Solve problem',
          constraints: '1 <= n <= 1000',
          timeLimit: 1000,
          memoryLimit: 256,
          codeforcesLink: 'https://codeforces.com',
        },
      } as any;

      prisma.question.create.mockResolvedValue({} as any);

      await service.create(dto);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Two Sum',

          categories: {
            create: [{ categoryId: 1 }],
          },

          companies: {
            create: [{ companyId: 2 }],
          },

          jobRoles: {
            create: [{ jobRoleId: 3 }],
          },

          codingQuestion: {
            create: {
              description: 'Solve problem',
              constraints: '1 <= n <= 1000',
              timeLimit: 1000,
              memoryLimit: 256,
              codeforcesLink: 'https://codeforces.com',
            },
          },
        }),
      });
    });
  });

  describe('update', () => {
    it('should update categories and coding data', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        type: QuestionType.CODING,
      } as any);

      prisma.question.update.mockResolvedValue({} as any);

      const dto: UpdateQuestionDto = {
        categoryIds: [5],

        codingData: {
          description: 'Updated',
        },
      } as any;

      await service.update(1, dto);

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 1 },

        data: expect.objectContaining({
          categories: {
            deleteMany: {},
            create: [{ categoryId: 5 }],
          },

          codingQuestion: {
            update: {
              description: 'Updated',
            },
          },
        }),
      });
    });

    it('should throw NotFoundException when updating missing question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.update(1, {} as UpdateQuestionDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete question by id', async () => {
      prisma.question.delete.mockResolvedValue({} as any);

      await service.remove(1);

      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
