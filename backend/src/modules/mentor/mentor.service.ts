import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';

import { MentorResponse } from './interfaces/mentor.interface';

import { Messages } from '../../common/constants/messages.constant';

import { Role, ApprovalStatus } from '@prisma/client';

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
  async findById(id: number): Promise<MentorResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.MENTOR,
      },

      include: {
        mentorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(Messages.MENTOR.NOT_FOUND);
    }

    return this.mapToMentorResponse(user);
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
      throw new NotFoundException('User không tồn tại');
    }

    if (existingUser.role !== Role.MENTOR) {
      throw new BadRequestException('Bạn không phải mentor');
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

                approvalStatus: ApprovalStatus.INCOMPLETE,
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
