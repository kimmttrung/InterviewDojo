import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTargetRoleDto } from './dto/create-target-role.dto';
import { UpdateTargetRoleDto } from './dto/update-target-role.dto';

@Injectable()
export class JobRoleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTargetRoleDto) {
    return this.prisma.jobRole.create({
      data: {
        name: dto.name,
        description: (dto as any).description || null,
      },
    });
  }

  async findAll() {
    return this.prisma.jobRole.findMany({
      // Tuỳ chọn: Sắp xếp theo tên cho dễ hiển thị ở UI
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, dto: UpdateTargetRoleDto) {
    return this.prisma.jobRole.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    return this.prisma.jobRole.delete({
      where: { id },
    });
  }

  async createMany(dto: { roles: { name: string; description?: string }[] }) {
    const data = dto.roles.map((role) => ({
      name: role.name,
      description: role.description || null,
    }));

    await this.prisma.jobRole.createMany({
      data,
      skipDuplicates: true, // Bỏ qua nếu đã tồn tại tên JobRole này
    });

    return {
      message: 'Tạo danh sách vị trí công việc (Job/Target Role) thành công',
    };
  }
}
