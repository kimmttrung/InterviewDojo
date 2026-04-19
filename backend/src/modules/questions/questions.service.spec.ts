import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Difficulty, TypeQuestion } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: DeepMocked<PrismaService>;

  const mockDate = new Date();

  const mockNormalQuestions = [
    {
      id: 1,
      title: 'NestJS Basics',
      difficulty: Difficulty.EASY,
      typeQuestion: TypeQuestion.BEHAVIORAL,
      isPUblished: true,
      createdAt: mockDate,
      categories: [{ category: { name: 'Backend' } }],
      companies: [{ company: { name: 'Google' } }],
    },
  ];

  const mockCodingQuestions = [
    {
      id: 1,
      title: 'Two Sum',
      difficulty: Difficulty.HARD,
      isPublished: true,
      createdAt: mockDate,
      categories: [{ category: { name: 'Algorithm' } }],
      companies: [],
    },
  ];

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
    it('nên gộp và format đúng ID từ cả 2 nguồn (Normal & Coding)', async () => {
      const query: GetQuestionsDto = { page: 1, limit: 10 };

      // KHÔNG cần dùng "as jest.Mock"
      prisma.question.findMany.mockResolvedValue(mockNormalQuestions as any);
      prisma.question.count.mockResolvedValue(1);
      prisma.codingQuestion.findMany.mockResolvedValue(
        mockCodingQuestions as any,
      );
      prisma.codingQuestion.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('q_1');
      expect(result.data[1].id).toBe('cq_1');
      expect(result.meta.total).toBe(2);
    });

    it('nên xử lý keyword theo định dạng FTS (A & B)', async () => {
      const query: GetQuestionsDto = { keyword: 'nest js' };
      prisma.question.findMany.mockResolvedValue([]);
      prisma.question.count.mockResolvedValue(0);
      prisma.codingQuestion.findMany.mockResolvedValue([]);
      prisma.codingQuestion.count.mockResolvedValue(0);

      await service.findAll(query);

      const expectedWhere = expect.objectContaining({
        OR: [
          { title: { search: 'nest & js' } },
          { title: { contains: 'nest js', mode: 'insensitive' } },
        ],
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
    });

    it('chỉ nên gọi bảng Coding khi source là CODING', async () => {
      const query: GetQuestionsDto = { source: 'CODING' as any };

      prisma.codingQuestion.findMany.mockResolvedValue(
        mockCodingQuestions as any,
      );
      prisma.codingQuestion.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(prisma.question.findMany).not.toHaveBeenCalled();
      expect(prisma.codingQuestion.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('nên trả về Coding Question khi ID bắt đầu bằng cq_', async () => {
      prisma.codingQuestion.findUnique.mockResolvedValue({
        ...mockCodingQuestions[0],
        testCases: [],
      } as any);

      const result = await service.findOne('cq_1');

      expect(result.isCodingQuestion).toBe(true);
      expect(prisma.codingQuestion.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, isPublished: true } }),
      );
    });

    it('nên ném lỗi NotFoundException nếu không tìm thấy câu hỏi', async () => {
      prisma.question.findUnique.mockResolvedValue(null);
      await expect(service.findOne('q_999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('nên tạo câu hỏi với mapping categoryIds/companyIds', async () => {
      const dto: CreateQuestionDto = {
        title: 'New',
        categoryIds: [1],
        companyIds: [1],
      } as any;

      await service.create(dto);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categories: { create: [{ categoryId: 1 }] },
          companies: { create: [{ companyId: 1 }] },
        }),
      });
    });
  });

  describe('update', () => {
    it('nên reset và cập nhật lại quan hệ khi update categoryIds', async () => {
      const updateDto: UpdateQuestionDto = { categoryIds: [5] };
      await service.update(1, updateDto);

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          categories: {
            deleteMany: {},
            create: [{ categoryId: 5 }],
          },
        }),
      });
    });
  });

  describe('remove', () => {
    it('nên gọi Prisma delete đúng ID', async () => {
      await service.remove(1);
      expect(prisma.question.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
