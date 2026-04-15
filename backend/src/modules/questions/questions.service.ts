import { Injectable, NotFoundException  } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: GetQuestionsDto) {
    const {
      keyword,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      typeQuestion,
    } = query;

    const skip = (page - 1) * limit;

    // Build query điều kiện
    const where: Prisma.QuestionWhereInput = {
      isPublished: true, // Mặc định chỉ lấy câu hỏi đã publish
    };

    // 1. Xử lý Full-Text Search
    if (keyword) {
      // Postgres FTS yêu cầu định dạng: "word1 & word2"
      const formattedKeyword = keyword.trim().split(/\s+/).join(' & ');

      where.OR = [
        { title: { search: formattedKeyword } },
        // Fallback dùng contains để bắt các chuỗi con không hoàn chỉnh (partial match)
        { title: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 2. Xử lý Filters
    if (difficulty) where.difficulty = difficulty;
    if (typeQuestion) where.typeQuestion = typeQuestion;

    // 3. Thực thi Query song song để tối ưu hiệu năng
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        // Include thêm các bảng liên quan để trả về đầy đủ context
        include: {
          categories: {
            include: { category: true },
          },
          companies: {
            include: { company: true },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    // 4. Định dạng lại Response
    return {
      data: questions.map((q) => ({
        ...q,
        // Làm phẳng (flatten) mảng categories và companies cho FE dễ dùng
        categories: q.categories.map((c) => c.category.name),
        companies: q.companies.map((c) => c.company.name),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
        isPublished: true, // đảm bảo chỉ lấy câu đã publish
      },
      include: {
        categories: {
          include: { category: true },
        },
        companies: {
          include: { company: true },
        },
        // nếu có answers thì thêm luôn
        // answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // format lại giống findAll cho FE dễ dùng
    return {
      ...question,
      categories: question.categories.map((c) => c.category.name),
      companies: question.companies.map((c) => c.company.name),
    };
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
