import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-coaching-category.dto';
import { UpdateCategoryDto } from './dto/update-coaching-category.dto';

@Injectable()
export class CoachingCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coachingCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.coachingCategory.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug đã tồn tại');

    return this.prisma.coachingCategory.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.coachingCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category không tồn tại');

    return this.prisma.coachingCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const category = await this.prisma.coachingCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category không tồn tại');

    return this.prisma.coachingCategory.delete({ where: { id } });
  }
}
