// src/modules/bookmark/bookmark.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class BookmarkService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getBookmarkedQuestions(userId: number, query: QueryBookmarkDto) {
    const {
      page = 1,
      limit = 10,
      difficulty,
      categoryIds,
      startDate,
      endDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    // Lọc theo difficulty (liên quan đến question)
    if (difficulty) {
      where.question = { difficulty };
    }

    // Lọc theo search (title)
    if (search) {
      where.question = {
        ...where.question,
        title: { contains: search, mode: 'insensitive' },
      };
    }

    // Lọc theo ngày lưu
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Lọc theo categories (cần join qua question -> categories)
    if (categoryIds && categoryIds.length) {
      where.question = {
        ...where.question,
        categories: { some: { categoryId: { in: categoryIds } } },
      };
    }

    const [total, bookmarks] = await Promise.all([
      this.prisma.userBookmark.count({ where }),
      this.prisma.userBookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          question: {
            include: {
              categories: { include: { category: true } },
              codingQuestion: true,
              theoryQuestion: true,
            },
          },
        },
      }),
    ]);

    const items = bookmarks.map((b) => ({
      id: b.question.id,
      title: b.question.title,
      slug: b.question.slug,
      difficulty: b.question.difficulty,
      type: b.question.type,
      categories: b.question.categories.map((qc) => ({
        id: qc.category.id,
        name: qc.category.name,
      })),
      bookmarkedAt: b.createdAt,
    }));

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

  async bookmark(userId: number, questionId: number) {
    // Kiểm tra question tồn tại
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại');

    const existing = await this.prisma.userBookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (existing) throw new BadRequestException('Câu hỏi đã được lưu trước đó');

    await this.prisma.userBookmark.create({ data: { userId, questionId } });

    this.eventEmitter.emit('user.bookmark.updated', { candidateId: userId });

    return { success: true, message: 'Đã lưu câu hỏi' };
  }

  async unbookmark(userId: number, questionId: number) {
    const bookmark = await this.prisma.userBookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (!bookmark) throw new NotFoundException('Chưa lưu câu hỏi này');

    await this.prisma.userBookmark.delete({
      where: { userId_questionId: { userId, questionId } },
    });
    return { success: true, message: 'Đã bỏ lưu câu hỏi' };
  }
}
