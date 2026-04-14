import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTargetRoleDto } from './dto/create-target-role.dto';
import { UpdateTargetRoleDto } from './dto/update-target-role.dto';

@Injectable()
export class TargetRoleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTargetRoleDto) {
    return this.prisma.targetRole.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.targetRole.findMany();
  }

  async update(id: number, dto: UpdateTargetRoleDto) {
    return this.prisma.targetRole.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    return this.prisma.targetRole.delete({
      where: { id },
    });
  }

  async createMany(dto: { roles: { name: string }[] }) {
    const data = dto.roles.map((role) => ({
      name: role.name,
    }));

    await this.prisma.targetRole.createMany({
      data,
      skipDuplicates: true, // tránh lỗi nếu trùng
    });

    return {
      message: 'Tạo danh sách target role thành công',
    };
  }
}
