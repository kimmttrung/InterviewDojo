import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        targetRole: true, // Lấy thông tin từ bảng TargetRole
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
      // Trả về tên của targetRole hoặc null
      target_role: user.targetRole?.name || null,
      experience_years: user.experienceYears,
      current_level: this.calculateLevel(user.experienceYears),
      avatar_url: user.avatarUrl,
      skills: user.skills?.map((us) => ({
        id: us.skill.id,
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

    // Xử lý logic cập nhật Skills
    const skillsUpdateData = dto.skill_ids
      ? {
          deleteMany: {},
          create: dto.skill_ids.map((skillId) => ({
            skill: { connect: { id: skillId } },
            score: 0,
          })),
        }
      : undefined;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatar_url,
        experienceYears: dto.experience_years,
        // CẬP NHẬT: Kết nối với bảng TargetRole thông qua ID
        ...(dto.target_role_id && {
          targetRole: { connect: { id: dto.target_role_id } },
        }),
        ...(skillsUpdateData && { skills: skillsUpdateData }),
      },
      include: {
        targetRole: true,
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
        target_role: updatedUser.targetRole?.name || null,
        experience_years: updatedUser.experienceYears,
        current_level: this.calculateLevel(updatedUser.experienceYears),
        avatar_url: updatedUser.avatarUrl,
        skills: updatedUser.skills.map((us) => ({
          id: us.skill.id,
          name: us.skill.name,
          score: us.score,
          category: us.skill.category,
        })),
      },
    };
  }

  async getStats(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Giữ nguyên mock data cho stats
    return {
      total_questions_viewed: 145,
      total_practice_sessions: 24,
      practice_breakdown: {
        solo_mode: 18,
        peer_mode: 6,
      },
      average_score: 85.5,
      streak_days: 5,
    };
  }

  async updateTargetRole(userId: number, dto: { target_role_id: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.role !== 'CANDIDATE') {
      throw new BadRequestException('CANIDATE mới được cập nhật target role');
    }

    const role = await this.prisma.targetRole.findUnique({
      where: { id: dto.target_role_id },
    });
    if (!role) {
      throw new BadRequestException('Target role không tồn tại');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        targetRole: {
          connect: { id: dto.target_role_id },
        },
      },
      include: {
        targetRole: true,
      },
    });

    return {
      message: 'Cập nhật target role thành công',
      data: {
        target_role: updatedUser.targetRole?.name,
      },
    };
  }

  async createMentorProfile(userId: number, dto: CreateMentorProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.role !== 'MENTOR') {
      throw new BadRequestException('Bạn không phải mentor');
    }

    const existing = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Mentor profile đã tồn tại');
    }

    return this.prisma.mentorProfile.create({
      data: {
        userId,
        cvUrl: dto.cvUrl,
        certificateUrl: dto.certificateUrl,
        approvalStatus: 'PENDING',
      },
    });
  }

  private calculateLevel(years: number): string {
    if (years >= 5) return 'Senior';
    if (years >= 2) return 'Mid-level';
    return 'Junior/Fresher';
  }
}
