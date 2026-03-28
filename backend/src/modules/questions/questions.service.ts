import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetQuestionsFilterDto } from './dto/get-questions-filter.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: GetQuestionsFilterDto) {
    const { categoryId, difficulty, companyId, targetRoleId, search } = filter;

    return this.prisma.question.findMany({
      where: {
        isPublished: true, // Chỉ lấy những câu đã công khai

        // Lọc theo Difficulty (Enum)
        difficulty: difficulty || undefined,

        // Lọc theo Category qua bảng trung gian category_question
        categories: categoryId
          ? {
              some: {
                categoryId: categoryId,
              },
            }
          : undefined,

        // Lọc theo Company qua bảng trung gian question_companies
        companies: companyId
          ? {
              some: {
                companyId: companyId,
              },
            }
          : undefined,

        // Lọc theo Target Role qua bảng trung gian target_role_question
        targetRoles: targetRoleId
          ? {
              some: {
                targetRoleId: targetRoleId,
              },
            }
          : undefined,

        // Tìm kiếm theo Title (Trong Schema của bạn là 'title', không phải 'content')
        title: search
          ? {
              contains: search,
              mode: 'insensitive',
            }
          : undefined,
      },
      include: {
        // Lấy thông tin Category từ bảng trung gian
        categories: {
          include: {
            category: true,
          },
        },
        // Lấy thông tin Company từ bảng trung gian
        companies: {
          include: {
            company: true,
          },
        },
        // Lấy thông tin TargetRole từ bảng trung gian
        targetRoles: {
          include: {
            targetRole: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Mới nhất lên đầu
      },
    });
  }
}
