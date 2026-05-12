// src/modules/mentor/mentor.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';
import {
  MentorResponse,
  PaginatedMentorResponse,
} from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role, ApprovalStatus, Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

// ==================== REUSABLE INCLUDE ====================
const mentorInclude = {
  mentorProfile: {
    include: {
      experiences: {
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        take: 2, // chỉ lấy 2 experiences cho listing
        include: { company: true, jobRole: true },
      },
    },
  },
  skills: {
    include: { skill: true },
    orderBy: { experienceMonths: 'desc' },
    take: 5, // chỉ lấy 5 skills cho listing
  },
} satisfies Prisma.UserInclude;

type MentorUser = Prisma.UserGetPayload<{ include: typeof mentorInclude }>;

// ==================== SERVICE ====================
@Injectable()
export class MentorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map Prisma object sang response DTO (type‑safe)
   */
  private mapToMentorResponse(user: MentorUser): MentorResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      experienceYears: user.experienceYears,
      linkedInLink: user.linkedInLink,
      githubLink: user.githubLink,
      createdAt: user.createdAt,
      mentorProfile: user.mentorProfile
        ? {
            id: user.mentorProfile.id,
            headline: user.mentorProfile.headline,
            introductionVideoUrl: user.mentorProfile.introductionVideoUrl,
            approvalStatus: user.mentorProfile.approvalStatus,
            createdAt: user.mentorProfile.createdAt,
            experiences: user.mentorProfile.experiences.map((exp) => ({
              id: exp.id,
              description: exp.description,
              isCurrent: exp.isCurrent,
              startDate: exp.startDate,
              endDate: exp.endDate,
              company: {
                id: exp.company.id,
                name: exp.company.name,
                logoUrl: exp.company.logoUrl,
                industry: exp.company.industry,
              },
              jobRole: {
                id: exp.jobRole.id,
                name: exp.jobRole.name,
              },
            })),
          }
        : null,
      skills: user.skills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        type: us.skill.type,
        level: us.level,
        experienceMonths: us.experienceMonths,
      })),
    };
  }

  /**
   * Danh sách mentor (có filter + phân trang)
   */
  async findAll(
    query: QueryMentorDto,
    currentUser?: JwtPayload,
  ): Promise<PaginatedMentorResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      roleIds,
      companyIds,
      industry,
      skillIds,
      categoryIds,
      search,
    } = query;

    const safeLimit = Math.min(limit, 50); // giới hạn tối đa 50
    const skip = (page - 1) * safeLimit;

    const isAdmin = currentUser?.role === Role.ADMIN;
    const filterStatus = isAdmin
      ? status || ApprovalStatus.ACTIVE
      : ApprovalStatus.ACTIVE;

    // --- Build AND conditions ---
    const conditions: any[] = [
      { role: Role.MENTOR },
      { mentorProfile: { is: { approvalStatus: filterStatus } } },
    ];

    // Experiences filter (role, company, industry) – gom thành một AND
    const experienceAND: any[] = [];
    if (roleIds?.length) experienceAND.push({ jobRoleId: { in: roleIds } });
    if (companyIds?.length)
      experienceAND.push({ companyId: { in: companyIds } });
    if (industry)
      experienceAND.push({
        company: { industry: { contains: industry, mode: 'insensitive' } },
      });
    if (experienceAND.length) {
      conditions.push({
        mentorProfile: {
          is: { experiences: { some: { AND: experienceAND } } },
        },
      });
    }

    // Skills filter
    if (skillIds?.length) {
      conditions.push({ skills: { some: { skillId: { in: skillIds } } } });
    }

    // Category filter (coaching plans)
    if (categoryIds?.length) {
      conditions.push({
        mentorProfile: {
          is: {
            coachingPlans: {
              some: { categoryId: { in: categoryIds }, isActive: true },
            },
          },
        },
      });
    }

    // Tổng hợp WHERE
    const where: any = { AND: conditions };

    // Search (thêm vào AND)
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            mentorProfile: {
              is: { headline: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      });
    }

    // --- Query ---
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: mentorInclude,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: users.map((u) => this.mapToMentorResponse(u)),
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Chi tiết một mentor
   */
  async findById(id: number): Promise<MentorResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.MENTOR },
      include: mentorInclude, // dùng chung include
    });
    if (!user) throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    return this.mapToMentorResponse(user);
  }

  /**
   * Mentor tự cập nhật profile
   */
  async updateMe(
    userId: number,
    data: UpdateMentorDto,
  ): Promise<MentorResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mentorProfile: true },
    });
    if (!existingUser) throw new NotFoundException('User không tồn tại');
    if (existingUser.role !== Role.MENTOR)
      throw new BadRequestException('Bạn không phải mentor');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        experienceYears: data.experienceYears,
        linkedInLink: data.linkedInLink,
        githubLink: data.githubLink,
        mentorProfile: existingUser.mentorProfile
          ? {
              update: {
                headline: data.headline,
                introductionVideoUrl: data.introductionVideoUrl,
              },
            }
          : {
              create: {
                headline: data.headline ?? 'Mentor',
                approvalStatus: ApprovalStatus.INCOMPLETE,
              },
            },
      },
      include: mentorInclude, // dùng chung include
    });

    return this.mapToMentorResponse(updatedUser);
  }
}
