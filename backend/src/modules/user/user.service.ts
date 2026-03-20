// user.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      target_role: user.targetRole,
      experience_years: user.experienceYears,
      current_level: this.calculateLevel(user.experienceYears),
      avatar_url: user.avatarUrl,
      skills: user.skills?.map((us) => ({
        name: us.skill.name || 'Unknown',
        score: us.score || 0,
        category: us.skill.category || 'Unknown',
      })),
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    if (!dto) {
      throw new BadRequestException('Dữ liệu không được để trống');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        bio: dto.bio,
        targetRole: dto.target_role,
        experienceYears: dto.experience_years,
        avatarUrl: dto.avatar_url ?? undefined,
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
    return {
      message: 'Cập nhật thông tin thành công',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        bio: updatedUser.bio,
        target_role: updatedUser.targetRole,
        experience_years: updatedUser.experienceYears,
        current_level: this.calculateLevel(updatedUser.experienceYears),
        avatar_url: updatedUser.avatarUrl,
        skills: updatedUser.skills.map((us) => ({
          name: us.skill.name,
          score: us.score,
          category: us.skill.category,
        })),
      },
    };
  }

  private calculateLevel(years: number): string {
    if (years >= 5) return 'Senior';
    if (years >= 2) return 'Mid-level';
    return 'Junior/Fresher';
  }
}
