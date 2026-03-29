import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
