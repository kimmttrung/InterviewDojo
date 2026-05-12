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
  MentorDetailResponse,
} from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role, ApprovalStatus, SlotStatus, Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

// ==================== REUSABLE INCLUDES ====================
const mentorListInclude = {
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

const mentorDetailInclude = {
  mentorProfile: {
    include: {
      experiences: {
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        include: { company: true, jobRole: true },
      },
      coachingPlans: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  },
  skills: {
    include: { skill: true },
  },
} satisfies Prisma.UserInclude;

type MentorListUser = Prisma.UserGetPayload<{
  include: typeof mentorListInclude;
}>;
type MentorDetailUser = Prisma.UserGetPayload<{
  include: typeof mentorDetailInclude;
}>;

// ==================== SERVICE ====================
@Injectable()
export class MentorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map cho danh sách mentor (gọn, dùng type từ mentorListInclude)
   */
  private mapToMentorResponse(user: MentorListUser): MentorResponse {
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
   * Map cho chi tiết mentor (đầy đủ, bao gồm coachingPlans, câu hỏi, proofUrl)
   */
  private mapToMentorDetailResponse(
    user: MentorDetailUser,
  ): MentorDetailResponse {
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
              company: exp.company
                ? {
                    id: exp.company.id,
                    name: exp.company.name,
                    logoUrl: exp.company.logoUrl,
                    industry: exp.company.industry,
                  }
                : null,
              jobRole: exp.jobRole
                ? {
                    id: exp.jobRole.id,
                    name: exp.jobRole.name,
                    description: exp.jobRole.description,
                  }
                : null,
            })),
            coachingPlans: user.mentorProfile.coachingPlans.map((plan) => ({
              id: plan.id,
              title: plan.title,
              description: plan.description,
              duration: plan.duration,
              price: plan.price,
              questions: plan.questions.map((q) => ({
                id: q.id,
                question: q.question,
                type: q.type,
                placeholder: q.placeholder,
                isRequired: q.isRequired,
                orderIndex: q.orderIndex,
              })),
            })),
          }
        : null,
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

    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;

    const isAdmin = currentUser?.role === Role.ADMIN;
    const filterStatus = isAdmin
      ? status || ApprovalStatus.ACTIVE
      : ApprovalStatus.ACTIVE;

    const conditions: any[] = [
      { role: Role.MENTOR },
      { mentorProfile: { is: { approvalStatus: filterStatus } } },
    ];

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

    if (skillIds?.length) {
      conditions.push({ skills: { some: { skillId: { in: skillIds } } } });
    }

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

    const where: any = { AND: conditions };

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

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: mentorListInclude,
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
   * Chi tiết một mentor (dùng include riêng, trả về nhiều thông tin hơn)
   */
  async findById(id: number): Promise<MentorDetailResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.MENTOR,
        mentorProfile: {
          is: { approvalStatus: ApprovalStatus.ACTIVE },
        },
      },
      include: mentorDetailInclude,
    });

    if (!user) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    return this.mapToMentorDetailResponse(user);
  }

  /**
   * Lấy slot trống của mentor
   */
  async findAvailableSlots(mentorId: number) {
    const mentor = await this.prisma.user.findFirst({
      where: {
        id: mentorId,
        role: Role.MENTOR,
        mentorProfile: {
          is: { approvalStatus: ApprovalStatus.ACTIVE },
        },
      },
      select: { id: true },
    });

    if (!mentor) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    return this.prisma.slot.findMany({
      where: {
        mentorId,
        status: SlotStatus.AVAILABLE,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        mentorId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
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

    if (!existingUser) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    if (existingUser.role !== Role.MENTOR) {
      throw new BadRequestException(Messages.MENTOR.NOT_MENTOR);
    }

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
                approvalStatus: ApprovalStatus.PENDING,
              },
            },
      },
      include: mentorListInclude,
    });

    return this.mapToMentorResponse(updatedUser);
  }
}
