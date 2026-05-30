// questions.service.spec.ts
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

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
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
        isBookmarked: false,
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

      // Kiểm tra OR array không phụ thuộc thứ tự
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'nest js', mode: 'insensitive' } },
              { title: { search: 'nest & js' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by difficulty and type', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);

      await service.findAll({
        difficulty: Difficulty.HARD,
        type: QuestionType.CODING,
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

    it('should filter by category and role and annotate bookmarks for a signed-in user', async () => {
      prisma.question.findMany.mockResolvedValue([
        {
          id: 8,
          title: 'Architecture',
          slug: 'architecture',
          difficulty: Difficulty.MEDIUM,
          type: QuestionType.TECHNICAL,
          isPublished: true,
          createdAt: mockDate,
          categories: [],
          companies: [],
          jobRoles: [],
          theoryQuestion: { data: { question: 'Explain architecture' } },
          codingQuestion: null,
        },
      ] as any);
      prisma.question.count.mockResolvedValue(1);
      prisma.userBookmark.findMany.mockResolvedValue([
        { questionId: 8 },
      ] as any);

      const result = await service.findAll(
        { category: 'Backend', jobRole: 'Developer' } as any,
        7,
      );

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: expect.any(Object),
            jobRoles: expect.any(Object),
          }),
        }),
      );
      expect(result.items[0].description).toBe('Explain architecture');
      expect(result.items[0].isBookmarked).toBe(true);
    });

    it('should return empty optional text and relation arrays when coding data is absent', async () => {
      prisma.question.findMany.mockResolvedValue([
        {
          id: 9,
          title: 'Incomplete',
          slug: 'incomplete',
          difficulty: Difficulty.EASY,
          type: QuestionType.CODING,
          isPublished: true,
          createdAt: mockDate,
          codingQuestion: null,
          theoryQuestion: null,
        },
        {
          id: 10,
          title: 'Theory missing data',
          slug: 'theory-missing',
          difficulty: Difficulty.EASY,
          type: QuestionType.TECHNICAL,
          isPublished: true,
          createdAt: mockDate,
          theoryQuestion: null,
        },
        {
          id: 11,
          title: 'Missing related records',
          slug: 'missing-related',
          difficulty: Difficulty.EASY,
          type: QuestionType.CODING,
          isPublished: true,
          createdAt: mockDate,
          categories: [{ category: null }],
          companies: [{ company: null }],
          jobRoles: [{ jobRole: null }],
          codingQuestion: null,
          theoryQuestion: null,
        },
      ] as any);
      prisma.question.count.mockResolvedValue(3);

      const result = await service.findAll({});

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          description: '',
          categories: [],
          companies: [],
          jobRoles: [],
        }),
      );
      expect(result.items[1].description).toBe('');
      expect(result.items[2]).toEqual(
        expect.objectContaining({
          categories: [''],
          companies: [''],
          jobRoles: [''],
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return coding question detail', async () => {
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: Difficulty.EASY,
        type: QuestionType.CODING,
        isPublished: true,
        createdAt: mockDate,
        updated_at: mockDate,
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
          constraints: null,
          timeLimit: 2000,
          memoryLimit: 256000,
          codeforcesLink: null,
          hints: [],
          tags: [],
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
      prisma.question.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should mark a question as bookmarked for a user', async () => {
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        title: 'Theory',
        slug: 'theory',
        difficulty: Difficulty.EASY,
        type: QuestionType.TECHNICAL,
        isPublished: true,
        createdAt: mockDate,
        updatedAt: mockDate,
        categories: [],
        companies: [],
        jobRoles: [],
        theoryQuestion: { data: { answer: 'Answer' } },
        codingQuestion: null,
      } as any);
      prisma.userBookmark.findUnique.mockResolvedValue({
        questionId: 1,
      } as any);

      const result = await service.findOne(1, 'CANDIDATE', 7);

      expect(result.isBookmarked).toBe(true);
      expect(prisma.userBookmark.findUnique).toHaveBeenCalledWith({
        where: { userId_questionId: { userId: 7, questionId: 1 } },
      });
    });

    it('should expose all test cases to an admin and map missing relation labels', async () => {
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        title: 'Admin Coding',
        slug: 'admin-coding',
        difficulty: Difficulty.EASY,
        type: QuestionType.CODING,
        isPublished: true,
        createdAt: mockDate,
        updated_at: mockDate,
        categories: [{ category: null }],
        companies: [{ company: null }],
        jobRoles: [{ jobRole: null }],
        theoryQuestion: null,
        codingQuestion: {
          description: 'Description',
          testCases: [
            {
              id: 1,
              input: 'a',
              expectedOutput: 'b',
              order: 1,
              isHidden: true,
              isSample: false,
            },
          ],
        },
      } as any);

      const result = await service.findOne(1, 'ADMIN');

      expect(result.testCases).toEqual([
        expect.objectContaining({ output: 'b', isHidden: true }),
      ]);
      expect(result.categories).toEqual(['']);
    });

    it('should expose only visible sample test cases to a candidate', async () => {
      prisma.question.findFirst.mockResolvedValue({
        id: 2,
        title: 'Candidate Coding',
        slug: 'candidate-coding',
        difficulty: Difficulty.EASY,
        type: QuestionType.CODING,
        isPublished: true,
        createdAt: mockDate,
        updated_at: mockDate,
        categories: [],
        companies: [],
        jobRoles: [],
        theoryQuestion: null,
        codingQuestion: {
          testCases: [
            {
              id: 1,
              input: 'a',
              expectedOutput: 'b',
              order: 1,
              isHidden: false,
              isSample: true,
            },
            {
              id: 2,
              input: 'x',
              expectedOutput: 'y',
              order: 2,
              isHidden: true,
              isSample: true,
            },
          ],
        },
      } as any);

      const result = await service.findOne(2, 'CANDIDATE');

      expect(result.testCases).toEqual([
        expect.objectContaining({ id: 1, output: 'b', isHidden: false }),
      ]);
    });
  });

  describe('create', () => {
    it('should create coding question with relations', async () => {
      const dto: CreateQuestionDto = {
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: Difficulty.EASY,
        type: QuestionType.CODING,
        isPublished: true,
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
          type: QuestionType.CODING,
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

    it('should create a theory question payload', async () => {
      prisma.question.create.mockResolvedValue({} as any);

      await service.create({
        title: 'Explain DI',
        slug: 'explain-di',
        difficulty: Difficulty.MEDIUM,
        type: QuestionType.TECHNICAL,
        theoryData: { answer: 'Dependency injection' },
      } as any);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: QuestionType.TECHNICAL,
          theoryQuestion: {
            create: { data: { answer: 'Dependency injection' } },
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
            update: expect.objectContaining({
              description: 'Updated',
            }),
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

    it('should update theory data and relationship collections', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        type: QuestionType.TECHNICAL,
      } as any);
      prisma.question.update.mockResolvedValue({} as any);

      await service.update(1, {
        companyIds: [2],
        jobRoleIds: [3],
        theoryData: { answer: 'Updated' },
      } as any);

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          companies: { deleteMany: {}, create: [{ companyId: 2 }] },
          jobRoles: { deleteMany: {}, create: [{ jobRoleId: 3 }] },
          theoryQuestion: { update: { data: { answer: 'Updated' } } },
        }),
      });
    });
  });

  describe('remove', () => {
    it('should delete question by id', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.question.delete.mockResolvedValue({} as any);

      await service.remove(1);

      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should reject deleting a missing question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRandom', () => {
    it('should pick one random question matching all filters', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      prisma.question.count.mockResolvedValue(2);
      prisma.question.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'Question',
          slug: 'question',
          difficulty: Difficulty.EASY,
          type: QuestionType.TECHNICAL,
          isPublished: true,
          createdAt: mockDate,
          updatedAt: mockDate,
          categories: [],
          companies: [],
          jobRoles: [],
          theoryQuestion: { data: { answer: 'A' } },
          codingQuestion: null,
        },
      ] as any);

      await service.findRandom({
        difficulty: Difficulty.EASY,
        type: QuestionType.TECHNICAL,
        category: 'System',
        jobRole: 'Backend',
      } as any);

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
          where: expect.objectContaining({
            difficulty: Difficulty.EASY,
            type: QuestionType.TECHNICAL,
          }),
        }),
      );
      jest.restoreAllMocks();
    });

    it('should reject random lookup when no questions match', async () => {
      prisma.question.count.mockResolvedValue(0);

      await expect(service.findRandom({} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject random lookup when count exists but the selected row disappears', async () => {
      prisma.question.count.mockResolvedValue(1);
      prisma.question.findMany.mockResolvedValue([]);

      await expect(service.findRandom({} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
