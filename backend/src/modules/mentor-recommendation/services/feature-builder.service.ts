import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Role, SkillType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FeatureBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async buildCandidateText(userId: number): Promise<string> {
    const candidate = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: Role.CANDIDATE,
      },

      include: {
        targetRole: true,

        skills: {
          include: {
            skill: true,
          },
        },

        bookmarks: {
          include: {
            question: {
              include: {
                categories: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },

        bookingsAsCandidate: {
          where: {
            status: BookingStatus.COMPLETED,
          },

          select: {
            snapshotPlanTitle: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const role = candidate.targetRole?.name ?? 'Unknown';

    const skills = candidate.skills
      .filter((item) => item.skill.type !== SkillType.LANGUAGE)
      .map((item) => item.skill.name);

    const languages = candidate.skills
      .filter((item) => item.skill.type === SkillType.LANGUAGE)
      .map((item) => item.skill.name);

    const bookmarkedQuestions = candidate.bookmarks.map(
      (item) => item.question.title,
    );

    const bookmarkedCategories = [
      ...new Set(
        candidate.bookmarks.flatMap((item) =>
          item.question.categories.map((category) => category.category.name),
        ),
      ),
    ];

    const bookingHistory = candidate.bookingsAsCandidate.map(
      (booking) => booking.snapshotPlanTitle,
    );

    return `
Role:
${role}

Skills:
${skills.join('\n') || 'None'}

Bookmarked Questions:
${bookmarkedQuestions.join('\n') || 'None'}

Interested Categories:
${bookmarkedCategories.join('\n') || 'None'}

Booking History:
${bookingHistory.join('\n') || 'None'}

Languages:
${languages.join('\n') || 'None'}

Experience:
${candidate.experienceYears} years
`.trim();
  }

  async buildMentorText(
    userId: number,
    summarizedBio: string,
  ): Promise<string> {
    const mentor = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: Role.MENTOR,
      },

      include: {
        skills: {
          include: {
            skill: true,
          },
        },

        mentorProfile: {
          include: {
            coachingPlans: {
              where: {
                isActive: true,
              },

              select: {
                title: true,
              },
            },

            experiences: {
              include: {
                company: true,
                jobRole: true,
              },
            },
          },
        },

        slots: {
          where: {
            isActive: true,

            endTime: {
              gt: new Date(),
            },
          },

          orderBy: {
            startTime: 'asc',
          },

          take: 5,

          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!mentor || !mentor.mentorProfile) {
      throw new NotFoundException('Mentor not found');
    }

    const skills = mentor.skills
      .filter((item) => item.skill.type !== SkillType.LANGUAGE)
      .map((item) => item.skill.name);

    const languages = mentor.skills
      .filter((item) => item.skill.type === SkillType.LANGUAGE)
      .map((item) => item.skill.name);

    const coachingPlans = mentor.mentorProfile.coachingPlans.map(
      (plan) => plan.title,
    );

    const experiences = mentor.mentorProfile.experiences.map((item) => {
      const role = item.jobRole.name;

      const company = item.company.name;

      return `${role} at ${company}`;
    });

    const availableSlots = mentor.slots.map(
      (slot) =>
        `${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`,
    );

    return `
Skills:
${skills.join('\n') || 'None'}

Bio:
${summarizedBio}

Experience:
${mentor.experienceYears} years

Career:
${experiences.join('\n') || 'None'}

Coaching Plan:
${coachingPlans.join('\n') || 'None'}

Languages:
${languages.join('\n') || 'None'}

Available Slots:
${availableSlots.join('\n') || 'None'}
`.trim();
  }
}
