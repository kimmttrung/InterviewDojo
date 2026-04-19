import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Difficulty, TypeQuestion } from '@prisma/client';

 

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: DeepMocked<PrismaService>;

  // 1. Mock dữ liệu với 3 bản ghi đa dạng để test Search & Filter
  const mockPrismaQuestions = [
    {
      id: 1,
      title: 'How to use NestJS?',
      content: 'Basic NestJS tutorial',
      difficulty: Difficulty.EASY,
      typeQuestion: TypeQuestion.BEHAVIORAL,
      isPublished: true,
      createdAt: new Date(),
      categories: [{ category: { name: 'Backend' } }],
      companies: [{ company: { name: 'Google' } }],
    },
    {
      id: 2,
      title: 'Advanced SQL Performance',
      content: 'Deep dive into indexing',
      difficulty: Difficulty.HARD,
      typeQuestion: TypeQuestion.TECHNICAL,
      isPublished: true,
      createdAt: new Date(),
      categories: [{ category: { name: 'Database' } }],
      companies: [],
    },
    {
      id: 3,
      title: 'Microservices Architecture',
      content: 'System design patterns',
      difficulty: Difficulty.MEDIUM,
      typeQuestion: TypeQuestion.SYSTEM_DESIGN,
      isPublished: true,
      createdAt: new Date(),
      categories: [
        { category: { name: 'Backend' } },
        { category: { name: 'Cloud' } },
      ],
      companies: [
        { company: { name: 'Amazon' } },
        { company: { name: 'Netflix' } },
      ],
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

  // --- TEST FIND ALL (SEARCH & FILTER) ---
  describe('findAll', () => {
    it('nên trả về đầy đủ 3 bản ghi và mapping đúng categories/companies', async () => {
      const query: GetQuestionsDto = { page: 1, limit: 10 };

      (prisma.question.findMany as unknown as jest.Mock).mockResolvedValue(
        mockPrismaQuestions,
      );
      (prisma.question.count as unknown as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(3);
      // Kiểm tra logic làm phẳng (flatten) mảng của bản ghi số 3
      expect(result.data[2].categories).toEqual(['Backend', 'Cloud']);
      expect(result.data[2].companies).toEqual(['Amazon', 'Netflix']);
      expect(result.meta.total).toBe(3);
    });

    it('nên format keyword nhiều từ thành định dạng Postgres FTS (A & B)', async () => {
      const query: GetQuestionsDto = { keyword: 'nest js' };
      (prisma.question.findMany as unknown as jest.Mock).mockResolvedValue([
        mockPrismaQuestions[0],
      ]);
      (prisma.question.count as unknown as jest.Mock).mockResolvedValue(1);

      await service.findAll(query);

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { search: 'nest & js' } }, // Kiểm tra logic split().join(' & ')
              { title: { contains: 'nest js', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('nên lọc chính xác theo Difficulty (HARD) và Type (TECHNICAL)', async () => {
      const query: GetQuestionsDto = {
        difficulty: Difficulty.HARD,
        typeQuestion: TypeQuestion.TECHNICAL,
      };

      (prisma.question.findMany as unknown as jest.Mock).mockResolvedValue([
        mockPrismaQuestions[1],
      ]);
      (prisma.question.count as unknown as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data[0].id).toBe(2);
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: Difficulty.HARD,
            typeQuestion: TypeQuestion.TECHNICAL,
            isPublished: true,
          }),
        }),
      );
    });

    it('nên xử lý phân trang đúng (skip và take)', async () => {
      const query: GetQuestionsDto = { page: 2, limit: 5 };
      (prisma.question.findMany as unknown as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as unknown as jest.Mock).mockResolvedValue(10);

      await service.findAll(query);

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (2-1) * 5
          take: 5,
        }),
      );
    });
  });

  // --- TEST CREATE ---
  describe('create', () => {
    it('nên tạo câu hỏi mới với các quan hệ categoryIds và companyIds', async () => {
      const createDto: CreateQuestionDto = {
        title: 'New Question',
        content: 'Content',
        difficulty: Difficulty.EASY,
        typeQuestion: TypeQuestion.TECHNICAL,
        categoryIds: [1, 2],
        companyIds: [10],
      } as any;

      (prisma.question.create as unknown as jest.Mock).mockResolvedValue({
        id: 99,
        ...createDto,
      } as unknown as any);

      await service.create(createDto);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categories: {
            create: [{ categoryId: 1 }, { categoryId: 2 }],
          },
          companies: {
            create: [{ companyId: 10 }],
          },
        }),
      });
    });
  });

  // --- TEST UPDATE ---
  describe('update', () => {
    it('nên xóa quan hệ cũ và tạo mới khi cập nhật danh sách categories', async () => {
      const updateDto: UpdateQuestionDto = {
        categoryIds: [99],
      };

      await service.update(1, updateDto);

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          categories: {
            deleteMany: {}, // Quan trọng: Reset quan hệ cũ
            create: [{ categoryId: 99 }],
          },
        }),
      });
    });
  });

  // --- TEST REMOVE ---
  describe('remove', () => {
    it('nên gọi lệnh xóa của Prisma với đúng ID', async () => {
      const deleteId = 5;
      await service.remove(deleteId);

      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: deleteId },
      });
    });
  });
});
