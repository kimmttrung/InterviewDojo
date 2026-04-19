// src/modules/companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    return await this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll() {
    return await this.prisma.company.findMany({
      include: {
        _count: {
          select: { questions: true }, // Đếm xem công ty này có bao nhiêu câu hỏi liên quan
        },
      },
    });
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company)
      throw new NotFoundException(`Công ty với ID ${id} không tồn tại`);
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id); // Kiểm tra tồn tại
    return await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Nhờ onDelete: Cascade trong schema, bảng question_companies sẽ tự động được dọn dẹp
    return await this.prisma.company.delete({
      where: { id },
    });
  }

  // Hàm dùng để fix lỗi ID trên Neon nếu cần
  async fixSequence() {
    return await this.prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM companies;`,
    );
  }
}
