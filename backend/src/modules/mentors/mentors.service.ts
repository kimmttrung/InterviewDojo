import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalStatus, Role, SlotStatus } from '@prisma/client';

@Injectable()
export class MentorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        role: Role.MENTOR,
        mentorProfile: {
          approvalStatus: ApprovalStatus.APPROVED,
        },
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        experienceYears: true,
        mentorProfile: {
          select: {
            experiences: {
              orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
              take: 2,
              select: {
                id: true,
                description: true,
                isCurrent: true,
                startDate: true,
                endDate: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    industry: true,
                  },
                },
                jobRole: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            level: true,
            timeUse: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const mentor = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.MENTOR,
        mentorProfile: {
          approvalStatus: ApprovalStatus.APPROVED,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        experienceYears: true,
        createdAt: true,
        mentorProfile: {
          select: {
            cvUrl: true,
            certificateUrl: true,
            approvalStatus: true,
            experiences: {
              orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
              select: {
                id: true,
                description: true,
                startDate: true,
                endDate: true,
                isCurrent: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    industry: true,
                  },
                },
                jobRole: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            level: true,
            timeUse: true,
          },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    return mentor;
  }

  async findAvailableSlots(id: number) {
    return this.prisma.slot.findMany({
      where: {
        mentorId: id,
        status: SlotStatus.AVAILABLE,
        startTime: {
          gte: new Date(),
        },
        booking: null,
      },
      orderBy: {
        startTime: 'asc',
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
  }
}
