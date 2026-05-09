import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import {
  Role,
  ApprovalStatus,
  SkillLevel,
  SessionMode,
  Prisma,
} from '@prisma/client'; // Import Prisma
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

// Định nghĩa type cho User với các relation cần thiết
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    targetRole: true;
    skills: {
      include: {
        skill: true;
      };
    };
  };
}>;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ========== USER PROFILE ==========

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        targetRole: true,
        skills: { include: { skill: true } },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    return this.mapUserResponse(user);
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
        // ❌ avatarUrl đã bị loại bỏ – không cho phép cập nhật avatar ở đây
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

    return this.mapUserResponse(updatedUser);
  }

  // ========== STATS ==========

  async getStats(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

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
      totalCodeSubmissions: totalSubmissions,
      totalPracticeSessions: soloSessionsCount + meetSessionsCount,
      practiceBreakdown: {
        soloMode: soloSessionsCount,
        peerMode: meetSessionsCount,
      },
      averageScore: Number(averageScore.toFixed(1)),
      streakDays: 5,
    };
  }

  // ========== TARGET ROLE ==========

  async updateTargetRole(userId: number, dto: { target_role_id: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User không tồn tại');
    if (user.role !== Role.CANDIDATE) {
      throw new BadRequestException(
        'Chỉ CANDIDATE mới được cập nhật target role',
      );
    }

    const role = await this.prisma.jobRole.findUnique({
      where: { id: dto.target_role_id },
    });

    if (!role) throw new BadRequestException('Target role không tồn tại');

    await this.prisma.user.update({
      where: { id: userId },
      data: { targetRole: { connect: { id: dto.target_role_id } } },
    });

    return { targetRole: role.name };
  }

  // ========== AVATAR ==========

  async uploadAvatar(userId: number, file: UploadedFileType) {
    // 1. Validate file size
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File quá lớn, tối đa 5MB');
    }

    // 2. Validate loại file
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPEG, PNG, WebP');
    }

    // 3. Lấy avatar cũ (nếu có)
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    const oldAvatarUrl = currentUser?.avatarUrl;

    // 4. Upload lên Cloudinary
    const result = await this.cloudinaryService.uploadAvatar(file);

    // 5. Cập nhật DB
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url },
      include: {
        targetRole: true,
        skills: { include: { skill: true } },
      },
    });

    // 6. Xoá avatar cũ (nếu có)
    if (oldAvatarUrl) {
      const publicId = this.extractPublicId(oldAvatarUrl);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteFile(publicId, 'image');
        } catch (err) {
          console.error('Xoá ảnh cũ thất bại:', err);
        }
      }
    }

    return this.mapUserResponse(updatedUser);
  }

  // ========== MENTOR PROFILE ==========

  async createMentorProfile(userId: number, dto: CreateMentorProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');
    if (user.role !== Role.MENTOR)
      throw new BadRequestException('Bạn không phải mentor');

    const existing = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (existing) throw new BadRequestException('Mentor profile đã tồn tại');

    return this.prisma.mentorProfile.create({
      data: {
        userId,
        cvUrl: dto.cvUrl,
        certificateUrl: dto.certificateUrl,
        approvalStatus: ApprovalStatus.PENDING,
      },
    });
  }

  // ========== HELPERS ==========

  private mapUserResponse(user: UserWithRelations) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      targetRole: user.targetRole?.name || null,
      experienceYears: user.experienceYears,
      currentLevel: this.calculateLevel(user.experienceYears),
      avatarUrl: user.avatarUrl,
      creditBalance: user.creditBalance,
      role: user.role,
      status: user.status,
      skills: user.skills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        type: us.skill.type,
        level: us.level,
        timeUse: us.timeUse,
      })),
    };
  }

  private extractPublicId(url: string): string | null {
    try {
      const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1].replace(/\.\w+$/, '');
      }
      return null;
    } catch {
      return null;
    }
  }

  private calculateLevel(years: number): string {
    if (years >= 5) return 'Senior';
    if (years >= 2) return 'Mid-level';
    return 'Junior/Fresher';
  }
}
