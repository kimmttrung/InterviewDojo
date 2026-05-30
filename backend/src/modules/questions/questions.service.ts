// questions.service.ts
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
    const theoryQuestionText = !isCoding
      ? specificData?.data?.question || q.title
      : q.title;
    return {
      id: q.id,
      title: theoryQuestionText,
      slug: q.slug,
      difficulty: q.difficulty,
      questionType: q.type,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      ...(!isCoding && { data: specificData?.data }),
      description: isCoding
        ? specificData?.description || ''
        : specificData?.data?.question || '',
      categories: q.categories?.map((c: any) => c.category?.name || '') || [],
      companies: q.companies?.map((c: any) => c.company?.name || '') || [],
      jobRoles: q.jobRoles?.map((j: any) => j.jobRole?.name || '') || [],
      isBookmarked: false, // mặc định false, sẽ ghi đè nếu có userId trong findAll
    };
  }

  private mapToQuestionDetail(rawQ: any, userRole?: string): QuestionDetail {
    const isCoding = rawQ.type === QuestionType.CODING;
    let testCasesToReturn: QuestionDetail['testCases'] = undefined;

    if (isCoding && rawQ.codingQuestion?.testCases) {
      const allTestCases: any[] = rawQ.codingQuestion.testCases;
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
        testCasesToReturn = allTestCases
          .filter((tc) => tc.isSample === true && tc.isHidden === false)
          .map((tc) => ({
            id: tc.id,
            input: tc.input,
            output: tc.expectedOutput,
            order: tc.order,
            isHidden: false,
            isSample: true,
          }));
      }
    }

    return {
      id: rawQ.id,
      title: !isCoding
        ? rawQ.theoryQuestion?.data?.question || rawQ.title
        : rawQ.title,
      slug: rawQ.slug,
      difficulty: rawQ.difficulty,
      type: rawQ.type,
      isPublished: rawQ.isPublished,
      createdAt: rawQ.createdAt,
      updatedAt: rawQ.updated_at,
      categories: rawQ.categories.map((c: any) => c.category?.name || ''),
      companies: rawQ.companies.map((c: any) => c.company?.name || ''),
      jobRoles: rawQ.jobRoles.map((j: any) => j.jobRole?.name || ''),
      isCodingQuestion: isCoding,
      data: !isCoding ? rawQ.theoryQuestion?.data : undefined,
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
      isBookmarked: false, // mặc định false, sẽ ghi đè nếu có userId trong findOne
    };
  }

  async findAll(
    query: GetQuestionsDto,
    userId?: number,
  ): Promise<PaginatedResponse<QuestionItem>> {
    const {
      keyword,
      page = 1,
      limit = 10,
      difficulty,
      type,
      category,
      jobRole,
      bookmarked,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = { isPublished: true };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { title: { search: keyword.split(/\s+/).join(' & ') } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;
    if (category) {
      where.categories = {
        some: {
          category: {
            name: { equals: category, mode: 'insensitive' },
          },
        },
      };
    }
    if (jobRole) {
      where.jobRoles = {
        some: {
          jobRole: {
            name: { equals: jobRole, mode: 'insensitive' },
          },
        },
      };
    }
    if (bookmarked && userId) {
      where.bookmarks = { some: { userId } };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

    let bookmarkedIds: number[] = [];
    if (userId) {
      const bookmarks = await this.prisma.userBookmark.findMany({
        where: { userId },
        select: { questionId: true },
      });
      bookmarkedIds = bookmarks.map((b) => b.questionId);
    }

    const items = questions.map((q) => {
      const item = this.toQuestionItem(q);
      if (userId) {
        item.isBookmarked = bookmarkedIds.includes(item.id);
      }
      return item;
    });

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

  async findOne(
    id: number,
    userRole?: string,
    userId?: number,
  ): Promise<QuestionDetail> {
    const rawQ = await this.prisma.question.findFirst({
      where: { id },
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

    const detail = this.mapToQuestionDetail(rawQ, userRole);
    if (userId) {
      const bookmark = await this.prisma.userBookmark.findUnique({
        where: { userId_questionId: { userId, questionId: id } },
      });
      detail.isBookmarked = !!bookmark;
    }
    return detail;
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
            codingQuestion: {
              update: {
                description: codingData.description,
                constraints: codingData.constraints,
                timeLimit: codingData.timeLimit,
                memoryLimit: codingData.memoryLimit,
                codeforcesLink: codingData.codeforcesLink,
                hints: (codingData as any).hints ?? [],
                tags: (codingData as any).tags ?? [],
                ...((codingData as any).testCases && {
                  testCases: {
                    deleteMany: {},
                    create: (codingData as any).testCases.map(
                      (tc: any, i: number) => ({
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isSample: tc.isSample ?? false,
                        isHidden: tc.isHidden ?? false,
                        points: tc.points ?? 1,
                        order: tc.order ?? i,
                        explanation: tc.explanation,
                      }),
                    ),
                  },
                }),
              },
            },
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
