import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { cosineSimilarity } from './utils/cosine-similarity.util';
import { jaccard } from './utils/jaccard-similarity.util';

import { HardFilterService } from './services/hard-filter.service';
import { RankingService } from './services/ranking.service';
import { ExperienceScoreService } from './services/experience-score.service';
import { MentorFeature } from './interfaces/mentor-feature.interface';
import { AvailibilityScoreService } from './services/availability-score.service';
import { TargetRoleScoreService } from './services/target-role-score.service';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hardFilter: HardFilterService,
    private readonly ranking: RankingService,
    private readonly experience: ExperienceScoreService,
    private readonly availability: AvailibilityScoreService,
    private readonly targetRoleScore: TargetRoleScoreService,
  ) {}

  async recommend(candidateId: number) {
    const candidate = await this.loadCandidate(candidateId);

    const mentors = await this.loadMentors();

    const filtered = this.hardFilter.filter(candidate, mentors);

    const rankingResult = filtered.map((mentor) => {
      const hasEmbedding =
        candidate.embedding.length > 0 && mentor.embedding.length > 0;

      const semantic = hasEmbedding
        ? cosineSimilarity(candidate.embedding, mentor.embedding)
        : 0;

      const skill = jaccard(candidate.skills, mentor.skills);

      const language =
        candidate.languages.length === 0
          ? 1
          : jaccard(candidate.languages, mentor.languages);

      const experience = this.experience.calculate(
        mentor.experienceYears,
        candidate.experienceYears,
      );

      const availability = this.availability.calculateAvailabilityScore(
        candidate.rawBookings,
        mentor.availableSlots,
      );

      const finalScore = this.ranking.rank({
        semantic,
        skill,
        experience,
        language,
        availability,
        targetRole: 0.15,
        finalScore: 0,
      });

      return {
        mentorId: mentor.id,

        recommendationScore: finalScore,
      };
    });

    const sorted = rankingResult
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 5);

    const mentorIds = sorted.map((item) => item.mentorId);

    const mentorEntities = await this.prisma.user.findMany({
      where: {
        id: {
          in: mentorIds,
        },

        mentorProfile: {
          isNot: null,
        },
      },

      select: {
        id: true,

        name: true,

        avatarUrl: true,

        bio: true,

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

            experienceMonths: true,
          },
        },

        mentorProfile: {
          select: {
            headline: true,

            experiences: {
              where: {
                isCurrent: true,
              },

              take: 1,

              select: {
                isCurrent: true,

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
            },
          },
        },
      },
    });

    const mentorMap = new Map(
      mentorEntities.map((mentor) => [mentor.id, mentor]),
    );

    return sorted
      .map((item) => ({
        ...mentorMap.get(item.mentorId),

        recommendationScore: item.recommendationScore,
      }))
      .filter(Boolean);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers: parse chuỗi vector Postgres trả về thành number[]
  // Postgres trả về dạng "[0.1,0.2,...]" hoặc "(0.1,0.2,...)"
  // ─────────────────────────────────────────────────────────────
  private parseVector(raw: string | null | undefined): number[] {
    if (!raw) return [];
    try {
      return raw
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    } catch {
      return [];
    }
  }

  private async loadCandidate(candidateId: number) {
    const [candidate, embeddingRaw] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: candidateId, role: 'CANDIDATE' },
        include: {
          skills: { include: { skill: true } },
          targetRole: true,
          bookingsAsCandidate: { where: { status: 'COMPLETED' } },
          bookmarks: { include: { question: true } },
        },
      }),
      this.prisma.$queryRaw<{ emb: string }[]>`
        SELECT embedding_vector::text AS emb
        FROM users
        WHERE id = ${candidateId}
      `,
    ]);

    if (!candidate) {
      throw new NotFoundException(
        `Candidate với ID ${candidateId} không tồn tại trên hệ thống.`,
      );
    }

    const embedding = this.parseVector(embeddingRaw[0]?.emb);

    return {
      id: candidate.id,
      embedding,
      experienceYears: candidate.experienceYears,
      skills: candidate.skills
        .filter((item) => item.skill.type !== 'LANGUAGE')
        .map((item) => item.skill.name),
      languages: candidate.skills
        .filter((item) => item.skill.type === 'LANGUAGE')
        .map((item) => item.skill.name),
      role: candidate.targetRole?.name ?? 'Unknown',
      bookmarkedQuestions: candidate.bookmarks.map((b) => b.question.slug),
      bookingHistory: candidate.bookingsAsCandidate.map((booking) =>
        String(booking.id),
      ),
      rawBookings: candidate.bookingsAsCandidate.map((booking) => ({
        startTime: booking.startTime,
        endTime: booking.endTime,
      })),
    };
  }

  private async loadMentors(): Promise<MentorFeature[]> {
    const [mentors, mentorEmbeddingsRaw] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'MENTOR',
          mentorProfile: { approvalStatus: 'ACTIVE' },
        },
        include: {
          skills: { include: { skill: true } },
          mentorProfile: {
            include: {
              coachingPlans: { where: { isActive: true } },
              experiences: { include: { jobRole: true } },
            },
          },
          slots: {
            where: {
              isActive: true,
              endTime: { gt: new Date() },
            },
          },
        },
      }),
      // Lấy toàn bộ embedding của MENTOR trong một raw query duy nhất
      this.prisma.$queryRaw<{ id: number; emb: string }[]>`
        SELECT id, embedding_vector::text AS emb
        FROM users
        WHERE role = 'MENTOR'
      `,
    ]);

    // Build Map<mentorId, number[]> để tra cứu O(1)
    const embeddingMap = new Map<number, number[]>(
      mentorEmbeddingsRaw.map(({ id, emb }) => [id, this.parseVector(emb)]),
    );

    return mentors.map((mentor) => {
      const profile = mentor.mentorProfile;

      const mentorRoles = profile?.experiences
        ? [...new Set(profile.experiences.map((exp) => exp.jobRole.name))]
        : [];

      return {
        id: mentor.id,
        embedding: embeddingMap.get(mentor.id) ?? [],
        experienceYears: mentor.experienceYears,
        skills: mentor.skills
          .filter((item) => item.skill.type !== 'LANGUAGE')
          .map((item) => item.skill.name),
        languages: mentor.skills
          .filter((item) => item.skill.type === 'LANGUAGE')
          .map((item) => item.skill.name),
        bio: mentor.bio ?? '',
        approvalStatus: profile?.approvalStatus ?? 'INCOMPLETE',
        coachingPlans: profile?.coachingPlans.map((plan) => plan.title) ?? [],
        availableSlots: mentor.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          recurrentType: slot.recurrentType,
          recurrentUntil: slot.recurrentUntil,
          isActive: slot.isActive,
        })),
        rawRoles: mentorRoles,
      };
    });
  }
}
