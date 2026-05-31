// src/modules/job-roles/job-roles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateJobRoleDto } from './dto/create-job-role.dto';
import { UpdateJobRoleDto } from './dto/update-job-role.dto';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class JobRolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.jobRole.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.jobRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Job role not found');
    return role;
  }

  async create(dto: CreateJobRoleDto) {
    return this.prisma.jobRole.create({ data: dto });
  }

  async update(id: number, dto: UpdateJobRoleDto) {
    await this.findOne(id);
    return this.prisma.jobRole.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    // Kiểm tra tồn tại
    const role = await this.prisma.jobRole.findUnique({
      where: { id },
      include: {
        experiences: { take: 1 }, // chỉ cần biết có tồn tại không
        candidates: { take: 1 }, // user nào đang dùng làm target role
      },
    });
    if (!role) throw new NotFoundException('Job role not found');

    // Kiểm tra ràng buộc
    if (role.experiences.length > 0) {
      throw new ConflictException(
        'Cannot delete job role because it is used in some mentor experiences. Please remove those experiences first.',
      );
    }
    if (role.candidates.length > 0) {
      throw new ConflictException(
        'Cannot delete job role because some candidates have it as target role. Please update their target role first.',
      );
    }

    // Nếu không có ràng buộc, xóa (cascade sẽ xóa QuestionJobRole tự động)
    return this.prisma.jobRole.delete({ where: { id } });
  }
}
