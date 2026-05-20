import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryCoachingDto } from './dto/create-coaching-category.dto';
import { UpdateCategoryCoachingDto } from './dto/update-coaching-category.dto';

@Injectable()
export class CoachingCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.coachingCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCategoryCoachingDto) {
    const existing = await this.prisma.coachingCategory.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug đã tồn tại');

    return this.prisma.coachingCategory.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryCoachingDto) {
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
