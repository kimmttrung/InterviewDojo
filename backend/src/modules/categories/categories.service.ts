// src/modules/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service'; // Đường dẫn tới PrismaService của bạn
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
      return await this.prisma.category.findMany();
    } catch (error) {
      console.error('LỖI DB:', error); // Dòng này sẽ hiện lỗi thật sự ở Terminal
      throw error;
    }
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Kiểm tra tồn tại trước
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại trước
    // Do có onDelete: Cascade trong schema, lệnh này sẽ tự xóa dữ liệu ở bảng CategoryQuestion
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async fixSequence() {
    try {
      // Câu lệnh này sẽ lấy ID lớn nhất hiện tại và đặt giá trị tiếp theo cho Sequence là ID đó + 1
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
