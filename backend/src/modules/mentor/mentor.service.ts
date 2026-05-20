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
  MentorDetailResponse,
} from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role, ApprovalStatus, Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UploadedFileType } from '@/common/types/uploaded-file.type';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SkillLevel } from '@prisma/client';

// ==================== REUSABLE INCLUDES ====================
const mentorListInclude = {
  mentorProfile: {
    include: {
      experiences: {
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        take: 2,
        include: { company: true, jobRole: true },
      },
    },
  },
  skills: {
    include: { skill: true },
    orderBy: { experienceMonths: 'desc' },
    take: 5,
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
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

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
   * Lấy slot trống của mentor (kiến trúc mới - chỉ lấy slot active)
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
        isActive: true,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        mentorId: true,
        startTime: true,
        endTime: true,
        isActive: true,
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
    try {
      // 1. Kiểm tra sự tồn tại và quyền hạn
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

      // THÊM CẤU HÌNH TIMEOUT CHO TRANSACTION Ở ĐÂY
      const result = await this.prisma.$transaction(
        async (tx) => {
          // 2. Cập nhật thông tin cơ bản của User
          await tx.user.update({
            where: { id: userId },
            data: {
              name: data.name,
              bio: data.bio,
              avatarUrl: data.avatarUrl,
              experienceYears: data.experienceYears,
              linkedInLink: data.linkedInLink,
              githubLink: data.githubLink,
            },
          });

          // 3. Upsert Mentor Profile
          const mentorProfile = await tx.mentorProfile.upsert({
            where: { userId },
            update: {
              headline: data.headline,
              introductionVideoUrl: data.introductionVideoUrl,
              approvalStatus: ApprovalStatus.PENDING, // Mỗi lần cập nhật, đưa về PENDING để admin xét duyệt lại
            },
            create: {
              userId,
              headline: data.headline ?? 'Mentor',
              introductionVideoUrl: data.introductionVideoUrl,
              approvalStatus: ApprovalStatus.PENDING,
            },
          });

          // 4. Xử lý Experiences (Đồng bộ hóa)
          if (data.experiences) {
            const incomingExpIds = data.experiences
              .map((e) => e.id)
              .filter((id): id is number => !!id);

            await tx.experience.deleteMany({
              where: {
                mentorId: mentorProfile.id,
                id: { notIn: incomingExpIds },
              },
            });

            for (const exp of data.experiences) {
              if (!exp.companyId || exp.companyId === 0) {
                throw new BadRequestException(
                  'Vui lòng chọn công ty (Company) cho kinh nghiệm làm việc.',
                );
              }
              if (!exp.jobRoleId || exp.jobRoleId === 0) {
                throw new BadRequestException(
                  'Vui lòng chọn chức danh (Job Role) cho kinh nghiệm làm việc.',
                );
              }
              if (!exp.startDate) {
                throw new BadRequestException(
                  'Vui lòng chọn ngày bắt đầu (Start Date).',
                );
              }

              const startDate = new Date(exp.startDate);
              const isCurrent = exp.isCurrent === true;

              const endDate =
                isCurrent || !exp.endDate ? null : new Date(exp.endDate);
              if (!isCurrent && endDate && startDate > endDate) {
                throw new BadRequestException(
                  'Ngày bắt đầu (Start Date) phải trước ngày kết thúc (End Date).',
                );
              }

              await tx.experience.upsert({
                where: { id: exp.id ?? 0 },
                update: {
                  companyId: exp.companyId,
                  jobRoleId: exp.jobRoleId,
                  description: exp.description,
                  startDate: startDate,
                  endDate: endDate,
                  isCurrent: exp.isCurrent,
                  proofUrl: exp.proofUrl,
                },
                create: {
                  mentorId: mentorProfile.id,
                  companyId: exp.companyId,
                  jobRoleId: exp.jobRoleId,
                  description: exp.description,
                  startDate: startDate,
                  endDate: endDate,
                  isCurrent: exp.isCurrent,
                  proofUrl: exp.proofUrl,
                },
              });
            }
          }

          // 5. Xử lý Skills (Đồng bộ hóa)
          if (data.skills) {
            const incomingSkillIds = data.skills.map((s) => s.skillId);
            await tx.userSkill.deleteMany({
              where: {
                userId,
                skillId: { notIn: incomingSkillIds },
              },
            });

            for (const sk of data.skills) {
              await tx.userSkill.upsert({
                where: {
                  userId_skillId: {
                    userId,
                    skillId: sk.skillId,
                  },
                },
                update: {
                  experienceMonths: sk.experienceMonths,
                  level: sk.level,
                  proofUrl: sk.proofUrl,
                },
                create: {
                  userId,
                  skillId: sk.skillId,
                  experienceMonths: sk.experienceMonths,
                  level: sk.level ?? SkillLevel.LEARNING,
                  proofUrl: sk.proofUrl,
                },
              });
            }
          }

          // ==============================================================
          // 6. XỬ LÝ COACHING PLANS VÀ QUESTIONS (TỐI ƯU VỚI NESTED WRITES)
          // ==============================================================
          if (data.coachingPlans) {
            const incomingPlanIds = data.coachingPlans
              .map((p) => p.id)
              .filter((id): id is number => !!id);

            await tx.coachingPlan.deleteMany({
              where: {
                mentorId: mentorProfile.id,
                id: { notIn: incomingPlanIds },
              },
            });

            for (const plan of data.coachingPlans) {
              if (!plan.categoryId || plan.categoryId === 0) {
                throw new BadRequestException(
                  'Vui lòng chọn danh mục (Category) cho Coaching Service.',
                );
              }

              const incomingQuestionIds =
                plan.questions
                  ?.map((q) => q.id)
                  .filter((id): id is number => !!id) || [];

              // Sử dụng tính năng Ghi lồng nhau (Nested Writes) của Prisma
              await tx.coachingPlan.upsert({
                where: { id: plan.id ?? 0 },

                // TRƯỜNG HỢP UPDATE: Đã có Plan, chỉ cập nhật Plan và danh sách câu hỏi
                update: {
                  title: plan.title,
                  description: plan.description,
                  duration: plan.duration,
                  price: plan.price,
                  categoryId: plan.categoryId,
                  isActive: plan.isActive ?? true,
                  questions: {
                    // Xóa các câu hỏi không còn tồn tại trên Frontend
                    deleteMany: {
                      id: { notIn: incomingQuestionIds },
                    },
                    // Upsert trực tiếp các câu hỏi bên trong (Prisma tự lo khóa ngoại)
                    upsert:
                      plan.questions?.map((q, i) => ({
                        where: { id: q.id ?? 0 },
                        update: {
                          question: q.question,
                          type: q.type,
                          isRequired: q.isRequired ?? false,
                          orderIndex: i,
                        },
                        create: {
                          question: q.question,
                          type: q.type,
                          isRequired: q.isRequired ?? false,
                          orderIndex: i,
                        },
                      })) || [],
                  },
                },

                // TRƯỜNG HỢP CREATE: Plan hoàn toàn mới
                create: {
                  mentorId: mentorProfile.id,
                  title: plan.title,
                  description: plan.description,
                  duration: plan.duration,
                  price: plan.price,
                  categoryId: plan.categoryId,
                  isActive: plan.isActive ?? true,
                  questions: {
                    create:
                      plan.questions?.map((q, i) => ({
                        question: q.question,
                        type: q.type,
                        isRequired: q.isRequired ?? false,
                        orderIndex: i,
                      })) || [],
                  },
                },
              });
            }
          }

          // ==============================================================
          // 7. TRUY VẤN TRẢ VỀ TOÀN BỘ DATA MỚI NHẤT
          // ==============================================================
          return tx.user.findUnique({
            where: { id: userId },
            include: {
              mentorProfile: {
                include: {
                  experiences: {
                    include: {
                      company: true,
                      jobRole: true,
                    },
                  },
                  coachingPlans: {
                    include: {
                      category: true,
                      questions: {
                        orderBy: { orderIndex: 'asc' },
                      },
                    },
                  },
                },
              },
              skills: {
                include: {
                  skill: true,
                },
              },
            },
          });
        },
        // THIẾT LẬP TIMEOUT CHO TRANSACTION LÊN 15 GIÂY (15000ms)
        {
          maxWait: 10000,
          timeout: 15000,
        },
      );

      if (!result) {
        throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
      }

      // 8. Mapping data sang Interface MentorResponse
      return this.mapToMentorResponse(result);
    } catch (error) {
      console.error('Error in updateMe:', error);
      throw error;
    }
  }

  async approveMentor(userId: number, adminId: number) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mentorProfile: true },
    });

    if (!mentor?.mentorProfile) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    const beforeStatus = mentor.mentorProfile.approvalStatus;

    await this.prisma.$transaction([
      this.prisma.mentorProfile.update({
        where: {
          id: mentor.mentorProfile.id,
        },
        data: {
          approvalStatus: ApprovalStatus.ACTIVE,
        },
      }),

      this.prisma.mentorApprovalLog.create({
        data: {
          mentorId: mentor.mentorProfile.id,
          adminId,
          statusBefore: beforeStatus,
          statusAfter: ApprovalStatus.ACTIVE,
        },
      }),
    ]);

    return null;
  }

  async rejectMentor(userId: number, adminId: number, note?: string) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mentorProfile: true },
    });

    if (!mentor?.mentorProfile) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    const beforeStatus = mentor.mentorProfile.approvalStatus;

    await this.prisma.$transaction([
      this.prisma.mentorProfile.update({
        where: {
          id: mentor.mentorProfile.id,
        },
        data: {
          approvalStatus: ApprovalStatus.REJECTED,
        },
      }),

      this.prisma.mentorApprovalLog.create({
        data: {
          mentorId: mentor.mentorProfile.id,
          adminId,
          statusBefore: beforeStatus,
          statusAfter: ApprovalStatus.REJECTED,
          note,
        },
      }),
    ]);

    return null;
  }
  async uploadIntroductionVideo(file: UploadedFileType) {
    const uploaded = await this.cloudinaryService.uploadVideo(
      file,
      'mentor-introduction-video',
    );

    return {
      videoUrl: uploaded.secure_url,
    };
  }
  async getMyMentorProfile(userId: number) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        approvalStatus: true,
        headline: true,
        introductionVideoUrl: true,

        user: {
          select: {
            name: true,
            bio: true,
            avatarUrl: true,
            githubLink: true,
            linkedInLink: true,
          },
        },

        experiences: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            jobRole: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        },

        coachingPlans: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            questions: {
              orderBy: {
                orderIndex: 'asc',
              },
              select: {
                id: true,
                question: true,
                type: true,
                isRequired: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!mentorProfile) {
      throw new NotFoundException('Mentor profile not found');
    }

    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        experienceMonths: 'desc',
      },
    });

    return {
      id: mentorProfile.id,
      approvalStatus: mentorProfile.approvalStatus,

      name: mentorProfile.user.name,
      bio: mentorProfile.user.bio,
      avatarUrl: mentorProfile.user.avatarUrl,
      githubLink: mentorProfile.user.githubLink,
      linkedInLink: mentorProfile.user.linkedInLink,

      headline: mentorProfile.headline,
      introductionVideoUrl: mentorProfile.introductionVideoUrl,

      experiences: mentorProfile.experiences.map((experience) => ({
        id: experience.id,
        startDate: experience.startDate,
        endDate: experience.endDate,
        isCurrent: experience.isCurrent,
        description: experience.description,
        proofUrl: experience.proofUrl,
        company: {
          id: experience.company?.id,
          name: experience.company?.name,
          logoUrl: experience.company?.logoUrl,
        },
        jobRole: {
          id: experience.jobRole?.id,
          name: experience.jobRole?.name,
        },
      })),

      skills: userSkills.map((skill) => ({
        skill: skill.skill.name,
        skillId: skill.skill.id,
        type: skill.skill.type,
        experienceMonths: skill.experienceMonths,
        level: skill.level,
        proofUrl: skill.proofUrl,
      })),

      coachingPlans: mentorProfile.coachingPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        duration: plan.duration,
        price: plan.price,
        isActive: plan.isActive,
        category: {
          id: plan.category.id,
          name: plan.category.name,
          slug: plan.category.slug,
        },
        questions: plan.questions,
      })),
    };
  }
}
