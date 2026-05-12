import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';

import { MentorResponse } from './interfaces/mentor.interface';

import { Messages } from '../../common/constants/messages.constant';

import { Role, ApprovalStatus, SlotStatus } from '@prisma/client';

@Injectable()
export class MentorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map User + MentorProfile
   */
  private mapToMentorResponse(user: any): MentorResponse {
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
          }
        : null,
    };
  }

  private mapToMentorDetailResponse(user: any) {
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
          }
        : null,

      skills: user.skills.map((item: any) => ({
        id: item.skill.id,
        name: item.skill.name,
        type: item.skill.type,
        level: item.level,
        experienceMonths: item.experienceMonths,
        proofUrl: item.proofUrl,
      })),

      experiences:
        user.mentorProfile?.experiences.map((item: any) => ({
          id: item.id,
          description: item.description,
          startDate: item.startDate,
          endDate: item.endDate,
          isCurrent: item.isCurrent,
          company: item.company
            ? {
                id: item.company.id,
                name: item.company.name,
                logoUrl: item.company.logoUrl,
                industry: item.company.industry,
              }
            : null,
          jobRole: item.jobRole
            ? {
                id: item.jobRole.id,
                name: item.jobRole.name,
                description: item.jobRole.description,
              }
            : null,
        })) ?? [],

      coachingPlans:
        user.mentorProfile?.coachingPlans.map((plan: any) => ({
          id: plan.id,
          title: plan.title,
          description: plan.description,
          duration: plan.duration,
          price: plan.price,
          questions:
            plan.questions?.map((question: any) => ({
              id: question.id,
              question: question.question,
              type: question.type,
              placeholder: question.placeholder,
              isRequired: question.isRequired,
              orderIndex: question.orderIndex,
            })) ?? [],
        })) ?? [],
    };
  }

  /**
   * List mentors
   */
  async findAll(
    query: QueryMentorDto,
    currentUser: any,
  ): Promise<MentorResponse[]> {
    const { page = 1, limit = 10, status } = query;

    const skip = (page - 1) * limit;

    const isAdmin = currentUser?.role === Role.ADMIN;

    /**
     * Candidate chỉ được xem mentor ACTIVE
     */
    const filterStatus = isAdmin ? status : ApprovalStatus.ACTIVE;

    const whereCondition: any = {
      role: Role.MENTOR,

      mentorProfile: filterStatus
        ? {
            is: {
              approvalStatus: filterStatus,
            },
          }
        : undefined,
    };

    const users = await this.prisma.user.findMany({
      where: whereCondition,

      include: {
        mentorProfile: true,
      },

      skip,
      take: limit,

      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.mapToMentorResponse(user));
  }

  /**
   * Find mentor detail
   */
  async findById(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.MENTOR,
        mentorProfile: {
          is: {
            approvalStatus: ApprovalStatus.ACTIVE,
          },
        },
      },

      include: {
        mentorProfile: {
          include: {
            experiences: {
              orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
              include: {
                company: true,
                jobRole: true,
              },
            },

            coachingPlans: {
              where: {
                isActive: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                questions: {
                  orderBy: {
                    orderIndex: 'asc',
                  },
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

    if (!user) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    return this.mapToMentorDetailResponse(user);
  }

  async findAvailableSlots(mentorId: number) {
    const mentor = await this.prisma.user.findFirst({
      where: {
        id: mentorId,
        role: Role.MENTOR,
        mentorProfile: {
          is: {
            approvalStatus: ApprovalStatus.ACTIVE,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!mentor) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    return this.prisma.slot.findMany({
      where: {
        mentorId,
        status: SlotStatus.AVAILABLE,
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
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
   * Update mentor profile
   */
  async updateMe(
    userId: number,
    data: UpdateMentorDto,
  ): Promise<MentorResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        mentorProfile: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(Messages.USER.NOT_FOUND);
    }

    if (existingUser.role !== Role.MENTOR) {
      throw new BadRequestException(Messages.MENTOR.NOT_MENTOR);
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },

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
              },
            }
          : {
              create: {
                headline: data.headline ?? 'Mentor',

                approvalStatus: ApprovalStatus.PENDING,
              },
            },
      },

      include: {
        mentorProfile: true,
      },
    });

    return this.mapToMentorResponse(updatedUser);
  }
}
