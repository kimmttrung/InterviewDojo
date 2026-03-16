import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Đảm bảo bạn đã tạo PrismaModule
import { GetQuestionsFilterDto } from './dto/get-questions-filter.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: GetQuestionsFilterDto) {
    const { categoryId, difficulty, companyId, search } = filter;

    return this.prisma.question.findMany({
      where: {
        // Lọc theo Category
        categoryId: categoryId || undefined,

        // Lọc theo Difficulty (Level)
        difficulty: difficulty || undefined,

        // Lọc theo Company (Truy vấn qua bảng trung gian QuestionCompany)
        companies: companyId
          ? {
              some: {
                companyId: companyId,
              },
            }
          : undefined,

        // Thêm tính năng tìm kiếm theo nội dung (Optional)
        content: search
          ? {
              contains: search,
              mode: 'insensitive', // Không phân biệt hoa thường
            }
          : undefined,
      },
      include: {
        category: true, // Lấy kèm thông tin Category
        companies: {
          include: {
            company: true, // Lấy kèm thông tin Company từ bảng trung gian
          },
        },
      },
      orderBy: {
        id: 'asc', // Sắp xếp theo ID
      },
    });
  }
}
