import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Định nghĩa Interface để TypeScript hiểu cấu trúc User đi kèm Skills
interface UserWithSkills {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  targetRole: string | null;
  avatarUrl: string | null;
  experienceYears: number;
  skills: {
    score: number;
    skill: {
      name: string;
      category: string | null;
    };
  }[];
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    // Ép kiểu (as) để tránh lỗi "Unsafe assignment" của ESLint
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })) as UserWithSkills | null;

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      target_role: user.targetRole,
      avatar_url: user.avatarUrl,
      experience_years: user.experienceYears,
      current_level: this.calculateLevel(user.experienceYears),
      // Truy cập thuộc tính bây giờ đã an toàn (không còn là any)
      skills: user.skills.map((us) => ({
        name: us.skill.name,
        score: us.score,
        category: us.skill.category,
      })),
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    // Sửa lỗi: Truy cập dto['target_company'] nếu TS chưa nhận diện được property trong DTO
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        bio: dto.bio,
        targetRole: dto.target_role,
      },
    });
  }

  private calculateLevel(years: number): string {
    if (years <= 0) return 'Intern / Fresher';
    if (years < 2) return 'Junior';
    if (years < 5) return 'Mid-level';
    return 'Senior';
  }
}
