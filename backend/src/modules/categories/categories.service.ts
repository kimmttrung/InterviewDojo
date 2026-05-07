import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: createCategoryDto,
      });
    } catch (error) {
      console.error('LỖI KHI TẠO CATEGORY:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.category.findMany({
        // Tùy chọn: Bạn có thể include thêm số lượng câu hỏi thuộc category này nếu cần
        // include: {
        //   _count: {
        //     select: { questions: true }
        //   }
        // }
      });
    } catch (error) {
      console.error('LỖI DB:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      // Tùy chọn: Include thêm các câu hỏi liên quan qua bảng trung gian QuestionCategory
      // include: {
      //   questions: {
      //     include: {
      //       question: true
      //     }
      //   }
      // }
    });

    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi update
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi xóa

    // Do có onDelete: Cascade trong schema ở model QuestionCategory,
    // lệnh này sẽ tự động xóa các bản ghi liên quan trong bảng question_categories
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async fixSequence() {
    try {
      // Lệnh này đồng bộ lại sequence id cho bảng categories trong PostgreSQL
      const result = await this.prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM categories;`,
      );
      console.log('Đã đồng bộ lại Sequence cho Categories');
      return { message: 'Đã đồng bộ lại ID thành công!', result };
    } catch (error) {
      console.error('Lỗi khi fix sequence:', error);
      throw error;
    }
  }
}
