import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { Role, ApprovalStatus, SkillLevel, SessionMode } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        targetRole: true,
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
      target_role: user.targetRole?.name || null,
      experience_years: user.experienceYears,
      current_level: this.calculateLevel(user.experienceYears),
      avatar_url: user.avatarUrl,
      credit_balance: user.creditBalance,
      role: user.role,
      status: user.status,
      skills: user.skills?.map((us) => ({
        id: us.skill.id,
        name: us.skill.name || 'Unknown',
        type: us.skill.type,
        level: us.level,
        time_use: us.timeUse,
      })),
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    if (!dto) {
      throw new BadRequestException('Dữ liệu không được để trống');
    }

    const skillsUpdateData = dto.skill_ids
      ? {
          deleteMany: {},
          create: dto.skill_ids.map((skillId) => ({
            skill: { connect: { id: skillId } },
            timeUse: 0,
            level: SkillLevel.LEARNING,
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
        credit_balance: updatedUser.creditBalance,
        role: updatedUser.role,
        status: updatedUser.status,
        skills: updatedUser.skills.map((us) => ({
          id: us.skill.id,
          name: us.skill.name,
          type: us.skill.type,
          level: us.level,
          time_use: us.timeUse,
        })),
      },
    };
  }

  async getStats(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Query số liệu thực tế từ database
    const soloSessionsCount = await this.prisma.mockSession.count({
      where: { intervieweeId: userId, mode: SessionMode.SOLO },
    });

    const meetSessionsCount = await this.prisma.mockSession.count({
      where: { intervieweeId: userId, mode: SessionMode.MEET },
    });

    const totalSubmissions = await this.prisma.codeSubmission.count({
      where: { userId },
    });

    const feedbacks = await this.prisma.feedback.findMany({
      where: { revieweeId: userId },
      select: { overallScore: true },
    });

    const averageScore =
      feedbacks.length > 0
        ? feedbacks.reduce((acc, curr) => acc + curr.overallScore, 0) /
          feedbacks.length
        : 0;

    return {
      total_code_submissions: totalSubmissions, // Thay total_questions_viewed bằng code submissions cho thực tế
      total_practice_sessions: soloSessionsCount + meetSessionsCount,
      practice_breakdown: {
        solo_mode: soloSessionsCount,
        peer_mode: meetSessionsCount,
      },
      average_score: Number(averageScore.toFixed(1)),
      streak_days: 5, // Tạm thời hardcode nếu bạn chưa có bảng tracking daily login
    };
  }

  async updateTargetRole(userId: number, dto: { target_role_id: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.role !== Role.CANDIDATE) {
      throw new BadRequestException(
        'Chỉ CANDIDATE mới được cập nhật target role',
      );
    }

    const role = await this.prisma.jobRole.findUnique({
      where: { id: dto.target_role_id },
    });

    if (!role) {
      throw new BadRequestException('Target role (Job Role) không tồn tại');
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

    if (user.role !== Role.MENTOR) {
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
        approvalStatus: ApprovalStatus.PENDING,
      },
    });
  }

  private calculateLevel(years: number): string {
    if (years >= 5) return 'Senior';
    if (years >= 2) return 'Mid-level';
    return 'Junior/Fresher';
  }
}
