import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';
import { MentorResponse } from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role, ApprovalStatus } from '@prisma/client';

@Injectable()
export class MentorService {
  constructor(private prisma: PrismaService) {}

  // Helper map gộp User và MentorProfile thành 1 object phẳng
  private mapToMentorResponse(user: any): MentorResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      experienceYears: user.experienceYears,
      avatarUrl: user.avatarUrl,
      cvUrl: user.mentorProfile?.cvUrl ?? null,
      certificateUrl: user.mentorProfile?.certificateUrl ?? null,
      approvalStatus: user.mentorProfile?.approvalStatus ?? null,
      createdAt: user.createdAt,
    };
  }

  async findAll(
    query: QueryMentorDto,
    currentUser: any,
  ): Promise<MentorResponse[]> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    // Logic RBAC: Nếu là Candidate/Guest, ép buộc chỉ lấy mentor APPROVED
    // Nếu là Admin, lấy theo query.status (hoặc lấy tất cả)
    const isAdmin = currentUser?.role === Role.ADMIN;
    const filterStatus = isAdmin ? status : ApprovalStatus.APPROVED;

    const whereCondition = {
      role: Role.MENTOR,
      mentorProfile: filterStatus
        ? { is: { approvalStatus: filterStatus } }
        : undefined,
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereCondition }),
      this.prisma.user.findMany({
        where: whereCondition,
        include: { mentorProfile: true }, // Join để lấy profile
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return users.map((user) => this.mapToMentorResponse(user));
  }

  async findById(id: number): Promise<MentorResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.MENTOR },
      include: { mentorProfile: true },
    });

    if (!user) throw new NotFoundException(Messages.MENTOR.NOT_FOUND);

    return this.mapToMentorResponse(user);
  }

  async updateMe(
    userId: number,
    data: UpdateMentorDto,
  ): Promise<MentorResponse> {
    // Nested Writes: Cập nhật User và MentorProfile cùng lúc
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        experienceYears: data.experienceYears,
        avatarUrl: data.avatarUrl,
        mentorProfile: {
          update: {
            cvUrl: data.cvUrl,
            certificateUrl: data.certificateUrl,
          },
        },
      },
      include: { mentorProfile: true },
    });

    return this.mapToMentorResponse(updatedUser);
  }
}
