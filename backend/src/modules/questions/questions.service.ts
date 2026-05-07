import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma, QuestionType } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Chuẩn hóa dữ liệu đầu ra chung cho cả Theory và Coding
  private mapQuestion(q: any) {
    const isCoding = q.type === QuestionType.CODING;
    const specificData = isCoding ? q.codingQuestion : q.theoryQuestion;

    return {
      id: q.id,
      title: q.title,
      slug: q.slug,
      difficulty: q.difficulty,
      questionType: q.type,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      description: isCoding
        ? specificData?.description || ''
        : specificData?.data?.question || '',
      categories: q.categories?.map((c: any) => c.category?.name || '') || [],
      companies: q.companies?.map((c: any) => c.company?.name || '') || [],
      jobRoles: q.jobRoles?.map((j: any) => j.jobRole?.name || '') || [],
    };
  }

  async findAll(query: GetQuestionsDto) {
    const {
      keyword,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      questionType,
    } = query;

    const skip = (page - 1) * limit;

    // 1. Build query điều kiện
    const where: Prisma.QuestionWhereInput = { isPublished: true };

    if (keyword) {
      const formattedKeyword = keyword.trim().split(/\s+/).join(' & ');
      where.OR = [
        { title: { search: formattedKeyword } },
        { title: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (questionType) {
      where.type = questionType;
    }

    // 2. Thực thi Database Query (DB tự xử lý Pagination và Sorting)
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          categories: { include: { category: true } },
          companies: { include: { company: true } },
          jobRoles: { include: { jobRole: true } }, // Bổ sung jobRoles từ schema mới
          theoryQuestion: true,
          codingQuestion: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    // 3. Map format trả về
    const formattedQuestions = questions.map((q) => this.mapQuestion(q));

    return {
      data: formattedQuestions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    // 1. Lấy toàn bộ thông tin câu hỏi dựa trên ID duy nhất
    const rawQ = await this.prisma.question.findUnique({
      where: { id, isPublished: true },
      include: {
        categories: { include: { category: true } },
        companies: { include: { company: true } },
        jobRoles: { include: { jobRole: true } },
        theoryQuestion: true,
        codingQuestion: {
          include: { testCases: { orderBy: { order: 'asc' } } }, // Load test cases nếu là coding
        },
      },
    });

    if (!rawQ) {
      throw new NotFoundException('Question not found');
    }

    const isCoding = rawQ.type === QuestionType.CODING;

    // 2. Trả về format chi tiết dùng cho trang Question Detail
    return {
      ...rawQ,
      isCodingQuestion: isCoding,
      categories: rawQ.categories.map((c) => c.category?.name || ''),
      companies: rawQ.companies.map((c) => c.company?.name || ''),
      jobRoles: rawQ.jobRoles.map((j) => j.jobRole?.name || ''),
      // Loại bỏ các property quan hệ nguyên bản để data trả về sạch sẽ hơn
      theoryQuestion: undefined,
      codingQuestion: undefined,
      // Gắn dữ liệu đặc thù vào root object
      ...(isCoding ? rawQ.codingQuestion : rawQ.theoryQuestion),
    };
  }

  async create(createDto: CreateQuestionDto) {
    // Lấy riêng các ID quan hệ và dữ liệu đặc thù
    const {
      categoryIds,
      companyIds,
      jobRoleIds,
      type,
      theoryData, // Payload cho Theory
      codingData, // Payload cho Coding
      ...baseQuestionData
    } = createDto;

    return this.prisma.question.create({
      data: {
        ...baseQuestionData,
        type: type,
        // Insert vào các bảng trung gian
        ...(categoryIds && {
          categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
        }),
        ...(companyIds && {
          companies: { create: companyIds.map((id) => ({ companyId: id })) },
        }),
        ...(jobRoleIds && {
          jobRoles: { create: jobRoleIds.map((id) => ({ jobRoleId: id })) },
        }),
        // Tạo Polymorphic Relation tương ứng
        ...(type !== QuestionType.CODING &&
          theoryData && {
            theoryQuestion: { create: { data: theoryData } },
          }),
        ...(type === QuestionType.CODING &&
          codingData && {
            codingQuestion: {
              create: {
                description: codingData.description,
                constraints: codingData.constraints,
                timeLimit: codingData.timeLimit,
                memoryLimit: codingData.memoryLimit,
                codeforcesLink: codingData.codeforcesLink,
              },
            },
          }),
      },
    });
  }

  async update(id: number, updateDto: UpdateQuestionDto) {
    const {
      categoryIds,
      companyIds,
      jobRoleIds,
      theoryData,
      codingData,
      ...baseQuestionData
    } = updateDto;

    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.question.update({
      where: { id },
      data: {
        ...baseQuestionData,
        ...(categoryIds && {
          categories: {
            deleteMany: {}, // Xóa mapping cũ
            create: categoryIds.map((catId) => ({ categoryId: catId })), // Tạo mới
          },
        }),
        ...(companyIds && {
          companies: {
            deleteMany: {},
            create: companyIds.map((compId) => ({ companyId: compId })),
          },
        }),
        ...(jobRoleIds && {
          jobRoles: {
            deleteMany: {},
            create: jobRoleIds.map((roleId) => ({ jobRoleId: roleId })),
          },
        }),
        // Update dữ liệu đặc thù
        ...(question.type !== QuestionType.CODING &&
          theoryData && {
            theoryQuestion: { update: { data: theoryData } },
          }),
        ...(question.type === QuestionType.CODING &&
          codingData && {
            codingQuestion: { update: codingData },
          }),
      },
    });
  }

  async remove(id: number) {
    // Chỉ cần xóa ở bảng Question.
    // Các bảng TheoryQuestion, CodingQuestion và các bảng Junction sẽ tự bay màu nhờ onDelete: Cascade
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
