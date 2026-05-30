import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetMentorsAdminDto } from './dto/get-mentors-admin.dto';
import { buildPaginationResponse } from '../../../common/interfaces/pagination.interface';
import { ApprovalStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@/common/enums/role.enum';

@Injectable()
export class MentorAdminService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(dto: GetMentorsAdminDto) {
    const { page, limit, status } = dto;
    const where: any = {};
    if (status) {
      where.mentorProfile = { is: { approvalStatus: status } };
    } else {
      where.mentorProfile = { isNot: null };
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          experienceYears: true,
          createdAt: true,
          mentorProfile: {
            include: {
              experiences: { include: { company: true, jobRole: true } },
              coachingPlans: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return buildPaginationResponse(users, total, page, limit);
  }

  async findOne(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        experienceYears: true,
        linkedInLink: true, // frontend hiển thị link LinkedIn
        githubLink: true, // frontend hiển thị link GitHub
        createdAt: true,
        // Skills: join qua UserSkill → Skill
        skills: {
          include: {
            skill: true,
          },
          orderBy: { experienceMonths: 'desc' },
        },
        mentorProfile: {
          include: {
            experiences: {
              orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
              include: { company: true, jobRole: true },
            },
            coachingPlans: {
              orderBy: { createdAt: 'desc' },
              include: {
                questions: { orderBy: { orderIndex: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!user || !user.mentorProfile)
      throw new NotFoundException('Mentor không tồn tại');

    // Map UserSkill[] → shape mà frontend expect
    return {
      ...user,
      skills: user.skills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        type: us.skill.type,
        level: us.level,
        experienceMonths: us.experienceMonths,
        proofUrl: us.proofUrl,
      })),
    };
  }

  async approve(userId: number, adminId: number) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!mentorProfile)
      throw new NotFoundException('Mentor profile không tồn tại');
    if (mentorProfile.approvalStatus === ApprovalStatus.ACTIVE) {
      throw new BadRequestException('Mentor đã được duyệt trước đó');
    }
    const oldStatus = mentorProfile.approvalStatus;
    await this.prisma.$transaction([
      this.prisma.mentorProfile.update({
        where: { userId },
        data: { approvalStatus: ApprovalStatus.ACTIVE },
      }),
      this.prisma.mentorApprovalLog.create({
        data: {
          mentorId: mentorProfile.id,
          adminId,
          statusBefore: oldStatus,
          statusAfter: ApprovalStatus.ACTIVE,
          note: null,
        },
      }),
    ]);

    this.eventEmitter.emit('user.profile.updated', {
      userId: userId,
      role: Role.MENTOR,
    });
  }

  async reject(userId: number, reason: string, adminId: number) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!mentorProfile)
      throw new NotFoundException('Mentor profile không tồn tại');
    if (mentorProfile.approvalStatus === ApprovalStatus.REJECTED) {
      throw new BadRequestException('Mentor đã bị từ chối trước đó');
    }
    const oldStatus = mentorProfile.approvalStatus;
    await this.prisma.$transaction([
      this.prisma.mentorProfile.update({
        where: { userId },
        data: { approvalStatus: ApprovalStatus.REJECTED },
      }),
      this.prisma.mentorApprovalLog.create({
        data: {
          mentorId: mentorProfile.id,
          adminId,
          statusBefore: oldStatus,
          statusAfter: ApprovalStatus.REJECTED,
          note: reason,
        },
      }),
    ]);
  }
}
