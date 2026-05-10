import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma, QuestionType } from '@prisma/client';
import { QuestionItem } from './interfaces/question-item.interface';
import { QuestionDetail } from './interfaces/question-detail.interface';
import { PaginatedResponse } from '@/common/interfaces/pagination.interface';
import { RandomQuestionDto } from './dto/random-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private toQuestionItem(q: any): QuestionItem {
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

  private mapToQuestionDetail(rawQ: any, userRole?: string): QuestionDetail {
    const isCoding = rawQ.type === QuestionType.CODING;
    let testCasesToReturn: QuestionDetail['testCases'] = undefined;

    if (isCoding && rawQ.codingQuestion?.testCases) {
      const allTestCases = rawQ.codingQuestion.testCases;
      if (userRole === 'ADMIN') {
        testCasesToReturn = allTestCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          output: tc.expectedOutput,
          order: tc.order,
          isHidden: tc.isHidden,
          isSample: tc.isSample,
        }));
      } else {
        // User thường: chỉ lấy test case mẫu (isSample = true) và không ẩn
        testCasesToReturn = allTestCases
          .filter((tc) => tc.isSample === true && tc.isHidden === false)
          .map((tc) => ({
            id: tc.id,
            input: tc.input,
            output: tc.expectedOutput,
            order: tc.order,
            isHidden: false, // hoặc không cần field này
            isSample: true,
          }));
      }
    }

    return {
      id: rawQ.id,
      title: rawQ.title,
      slug: rawQ.slug,
      difficulty: rawQ.difficulty,
      type: rawQ.type,
      isPublished: rawQ.isPublished,
      createdAt: rawQ.createdAt,
      updatedAt: rawQ.updated_at, // lưu ý snake_case nếu trong model là updated_at
      categories: rawQ.categories.map((c: any) => c.category?.name || ''),
      companies: rawQ.companies.map((c: any) => c.company?.name || ''),
      jobRoles: rawQ.jobRoles.map((j: any) => j.jobRole?.name || ''),
      isCodingQuestion: isCoding,
      // Theory
      data: !isCoding ? rawQ.theoryQuestion?.data : undefined,
      // Coding
      description: isCoding ? rawQ.codingQuestion?.description : undefined,
      constraints: isCoding ? rawQ.codingQuestion?.constraints : undefined,
      timeLimit: isCoding ? rawQ.codingQuestion?.timeLimit : undefined,
      memoryLimit: isCoding ? rawQ.codingQuestion?.memoryLimit : undefined,
      codeforcesLink: isCoding
        ? rawQ.codingQuestion?.codeforcesLink
        : undefined,
      testCases: testCasesToReturn,
      hints: isCoding ? rawQ.codingQuestion?.hints : undefined,
      tags: isCoding ? rawQ.codingQuestion?.tags : undefined,
    };
  }

  async findAll(
    query: GetQuestionsDto,
  ): Promise<PaginatedResponse<QuestionItem>> {
    const {
      keyword,
      page = 1,
      limit = 10,
      difficulty,
      type, // lọc theo loại câu hỏi (CODING, TECHNICAL, ...)
      category, // tên category
      jobRole, // tên job role
    } = query;

    const skip = (page - 1) * limit;

    // Xây dựng where condition
    const where: Prisma.QuestionWhereInput = { isPublished: true };

    if (keyword) {
      // full-text search (cần index GIN)
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { title: { search: keyword.split(/\s+/).join(' & ') } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;

    // Filter theo category (thông qua bảng junction)
    if (category) {
      where.categories = {
        some: {
          category: {
            name: { equals: category, mode: 'insensitive' },
          },
        },
      };
    }

    // Filter theo job role
    if (jobRole) {
      where.jobRoles = {
        some: {
          jobRole: {
            name: { equals: jobRole, mode: 'insensitive' },
          },
        },
      };
    }

    // Lấy dữ liệu và total
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // có thể custom sort sau nếu cần
        include: {
          categories: { include: { category: true } },
          companies: { include: { company: true } },
          jobRoles: { include: { jobRole: true } },
          theoryQuestion: true,
          codingQuestion: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    const items = questions.map((q) => this.toQuestionItem(q));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userRole?: string): Promise<QuestionDetail> {
    const rawQ = await this.prisma.question.findUnique({
      where: { id, isPublished: true },
      include: {
        categories: { include: { category: true } },
        companies: { include: { company: true } },
        jobRoles: { include: { jobRole: true } },
        theoryQuestion: true,
        codingQuestion: {
          include: { testCases: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!rawQ) throw new NotFoundException('Question not found');
    return this.mapToQuestionDetail(rawQ, userRole);
  }

  async create(createDto: CreateQuestionDto) {
    const {
      categoryIds,
      companyIds,
      jobRoleIds,
      type,
      theoryData,
      codingData,
      ...baseQuestionData
    } = createDto;

    return this.prisma.question.create({
      data: {
        ...baseQuestionData,
        type,
        ...(categoryIds && {
          categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
        }),
        ...(companyIds && {
          companies: { create: companyIds.map((id) => ({ companyId: id })) },
        }),
        ...(jobRoleIds && {
          jobRoles: { create: jobRoleIds.map((id) => ({ jobRoleId: id })) },
        }),
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
            deleteMany: {},
            create: categoryIds.map((catId) => ({ categoryId: catId })),
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
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    return this.prisma.question.delete({ where: { id } });
  }

  async findRandom(
    filter: RandomQuestionDto,
    userRole?: string,
  ): Promise<QuestionDetail> {
    const where: Prisma.QuestionWhereInput = { isPublished: true };

    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.type) where.type = filter.type;
    if (filter.category) {
      where.categories = {
        some: {
          category: { name: { equals: filter.category, mode: 'insensitive' } },
        },
      };
    }
    if (filter.jobRole) {
      where.jobRoles = {
        some: {
          jobRole: { name: { equals: filter.jobRole, mode: 'insensitive' } },
        },
      };
    }

    const total = await this.prisma.question.count({ where });
    if (total === 0) {
      throw new NotFoundException('Không có câu hỏi nào phù hợp với bộ lọc');
    }

    const randomOffset = Math.floor(Math.random() * total);
    const [randomQuestion] = await this.prisma.question.findMany({
      where,
      skip: randomOffset,
      take: 1,
      include: {
        categories: { include: { category: true } },
        companies: { include: { company: true } },
        jobRoles: { include: { jobRole: true } },
        theoryQuestion: true,
        codingQuestion: {
          include: { testCases: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!randomQuestion) {
      throw new NotFoundException('Không tìm thấy câu hỏi ngẫu nhiên');
    }

    return this.mapToQuestionDetail(randomQuestion, userRole);
  }
}
