import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // chuẩn hóa dữ liệu về format chung cho câu hỏi normal và coding
  private mapNormalQuestion(q: any) {
    return {
      id: `q_${q.id}`,
      title: q.title,
      slug: q.slug,
      difficulty: q.difficulty,
      typeQuestion: q.typeQuestion,
      description: q.data?.question || '',
      isPublished: q.isPUblished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      categories: q.categories.map((c) => c.category?.name || '') || [],
      companies: q.companies.map((c) => c.company?.name || '') || [],
    };
  }

  private mapCodingQuestion(cq: any) {
    return {
      id: `cq_${cq.id}`,
      title: cq.title,
      slug: cq.slug,
      typeQuestion: 'CODING',
      difficulty: cq.difficulty,
      description: cq.description,
      isPublished: cq.isPublished,
      createdAt: cq.createdAt,
      updatedAt: cq.updatedAt,
      categories: cq.categories?.map((c) => c.category?.name || '') || [],
      companies: cq.companies?.map((c) => c.company?.name || '') || [],
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
      typeQuestion,
      source,
    } = query;

    const skip = (page - 1) * limit;
    const itemsToFetch = skip + limit;

    const whereQ: Prisma.QuestionWhereInput = { isPublished: true };
    const whereCQ: Prisma.CodingQuestionWhereInput = { isPublished: true };

    if (keyword) {
      const formattedKeyword = keyword.trim().split(/\s+/).join(' & ');

      whereQ.OR = [
        { title: { search: formattedKeyword } },
        { title: { contains: keyword, mode: 'insensitive' } },
      ];
      whereCQ.OR = [
        { title: { search: formattedKeyword } },
        { title: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (difficulty) {
      whereQ.difficulty = difficulty;
      whereCQ.difficulty = difficulty;
    }

    let questionsPromise: any = Promise.resolve([[], 0]);
    let codingPromise: any = Promise.resolve([[], 0]);

    if (!source || source === 'NORMAL') {
      if (typeQuestion) whereQ.typeQuestion = typeQuestion;
      questionsPromise = Promise.all([
        this.prisma.question.findMany({
          where: whereQ,
          take: itemsToFetch,
          orderBy: { [sortBy]: sortOrder },
          include: {
            categories: { include: { category: true } },
            companies: { include: { company: true } },
          },
        }),
        this.prisma.question.count({ where: whereQ }),
      ]);
    }

    if (!source || source === 'CODING') {
      codingPromise = Promise.all([
        this.prisma.codingQuestion.findMany({
          where: whereCQ,
          take: itemsToFetch,
          orderBy: { [sortBy]: sortOrder },
          include: {
            categories: { include: { category: true } },
            companies: { include: { company: true } },
          },
        }),
        this.prisma.codingQuestion.count({ where: whereCQ }),
      ]);
    }

    // 4. Thực thi Query song song
    const [[questions, totalQ], [codingQuestions, totalCQ]] = await Promise.all(
      [questionsPromise, codingPromise],
    );

    // 5. Chuẩn hóa & Gộp Data
    const formattedQuestions = questions.map((q) => this.mapNormalQuestion(q));
    const formattedCoding = codingQuestions.map((cq) =>
      this.mapCodingQuestion(cq),
    );

    const combined = [...formattedQuestions, ...formattedCoding];

    // 6. Sắp xếp mảng đã gộp bằng JavaScript
    combined.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Nếu field là Date (createdAt, updatedAt)
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    // 7. Cắt data tương ứng với trang hiện tại
    const paginatedData = combined.slice(skip, skip + limit);
    const total = totalQ + totalCQ;

    return {
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idString: string) {
    if (!idString || typeof idString !== 'string') {
      throw new BadRequestException(
        'ID format must be a string (e.g., q_1 or cq_1)',
      );
    }

    // Phân tích ID để biết cần gọi vào bảng nào
    if (idString.startsWith('cq_')) {
      // 1. Logic cho Coding Question
      const id = parseInt(idString.replace('cq_', ''), 10);
      const rawCq = await this.prisma.codingQuestion.findUnique({
        where: { id, isPublished: true },
        include: {
          categories: { include: { category: true } },
          companies: { include: { company: true } },
          testCases: true, // Thêm testCases vì giao diện Code thường sẽ cần cái này
        },
      });

      if (!rawCq) {
        throw new NotFoundException('Coding Question not found');
      }

      // Trả về nguyên bản, chỉ làm phẳng categories và companies
      return {
        ...rawCq,
        isCodingQuestion: true, // (Tuỳ chọn) Gửi kèm 1 cờ để FE dễ điều hướng giao diện
        categories: rawCq.categories.map((c) => c.category?.name || ''),
        companies: rawCq.companies.map((c) => c.company?.name || ''),
      };
    } else if (idString.startsWith('q_')) {
      // 2. Logic cho Question thường
      const id = parseInt(idString.replace('q_', ''), 10);
      const rawQ = await this.prisma.question.findUnique({
        where: { id, isPublished: true },
        include: {
          categories: { include: { category: true } },
          companies: { include: { company: true } },
        },
      });

      if (!rawQ) {
        throw new NotFoundException('Question not found');
      }

      // Trả về nguyên bản, chỉ làm phẳng categories và companies
      return {
        ...rawQ,
        isCodingQuestion: false,
        categories: rawQ.categories.map((c) => c.category?.name || ''),
        companies: rawQ.companies.map((c) => c.company?.name || ''),
      };
    } else {
      throw new BadRequestException('Invalid ID format. Prefix with q_ or cq_');
    }
  }

  async create(createDto: CreateQuestionDto) {
    const { categoryIds, companyIds, ...questionData } = createDto;

    return this.prisma.question.create({
      data: {
        ...questionData,
        // Insert vào bảng trung gian CategoryQuestion
        ...(categoryIds && {
          categories: {
            create: categoryIds.map((id) => ({ categoryId: id })),
          },
        }),
        // Insert vào bảng trung gian QuestionCompany
        ...(companyIds && {
          companies: {
            create: companyIds.map((id) => ({ companyId: id })),
          },
        }),
      },
    });
  }

  async update(id: number, updateDto: UpdateQuestionDto) {
    const { categoryIds, companyIds, ...questionData } = updateDto;

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        // Nếu có truyền categoryIds mới -> Xóa list cũ đi, nối list mới vào
        ...(categoryIds && {
          categories: {
            deleteMany: {}, // Xóa các record trong bảng category_question có questionId này
            create: categoryIds.map((id) => ({ categoryId: id })),
          },
        }),
        // Tương tự cho companies
        ...(companyIds && {
          companies: {
            deleteMany: {},
            create: companyIds.map((id) => ({ companyId: id })),
          },
        }),
      },
    });
  }

  async remove(id: number) {
    // Vì Schema bạn đã set onDelete: Cascade ở các bảng trung gian,
    // nên chỉ cần xóa Question, Prisma/Postgres sẽ tự dọn dẹp các rác liên quan.
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
