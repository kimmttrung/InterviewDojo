import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import { cosineSimilarity } from './utils/cosine-similarity.util';
import { jaccard } from './utils/jaccard-similarity.util';

import { HardFilterService } from './services/hard-filter.service';
import { RankingService } from './services/ranking.service';
import { ExperienceScoreService } from './services/experience-score.service';
import { MentorFeature } from './interfaces/mentor-feature.interface';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly hardFilter: HardFilterService,

    private readonly ranking: RankingService,

    private readonly experience: ExperienceScoreService,
  ) {}

  async recommend(candidateId: number) {
    const candidate = await this.loadCandidate(candidateId);

    const mentors = await this.loadMentors();

    const filtered = this.hardFilter.filter(candidate, mentors);

    const result = filtered.map((mentor) => {
      const semantic = cosineSimilarity(
        candidate.embedding,

        mentor.embedding,
      );

      const skill = jaccard(
        candidate.skills,

        mentor.skills,
      );

      const language = jaccard(
        candidate.languages,

        mentor.languages,
      );

      const experience = this.experience.calculate(
        mentor.experienceYears,
        candidate.experienceYears,
      );

      // SỬA LỖI 2: Thêm thuộc tính finalScore mặc định vào để khớp kiểu RecommendationScore
      const finalScore = this.ranking.rank({
        semantic,
        skill,
        experience,

        role: 1,

        language,

        availability: mentor.availableSlots.length > 0 ? 1 : 0,
        finalScore: 0,
      });

      return {
        mentorId: mentor.id,

        // Nếu hàm rank trả về một object chứa score (ví dụ: finalScore.finalScore) thì sửa thành finalScore.finalScore
        // Còn nếu hàm rank trả về thẳng 1 biến number thì giữ nguyên như dòng dưới:
        finalScore:
          typeof finalScore === 'object'
            ? (finalScore as any).finalScore
            : finalScore,
      };
    });

    return result.sort((a, b) => b.finalScore - a.finalScore);
  }

  private async loadCandidate(candidateId: number) {
    const candidate = await this.prisma.user.findUnique({
      where: {
        id: candidateId,
        role: 'CANDIDATE',
      },
      include: {
        skills: { include: { skill: true } },
        targetRole: true,
        bookingsAsCandidate: { where: { status: 'COMPLETED' } },
        bookmarks: { include: { question: true } },
      },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return {
      id: candidate.id,
      embedding: ((candidate as any).embeddingVector ?? []) as number[],
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
    };
  }

  private async loadMentors(): Promise<MentorFeature[]> {
    const mentors = await this.prisma.user.findMany({
      where: {
        role: 'MENTOR',
        mentorProfile: {
          approvalStatus: 'ACTIVE',
        },
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
              where: { isActive: true },
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
        },
      },
    });

    return mentors.map((mentor) => {
      const profile = mentor.mentorProfile;

      return {
        id: mentor.id,
        embedding: ((mentor as any).embeddingVector ?? []) as number[],
        experienceYears: mentor.experienceYears,
        skills: mentor.skills.map((item) => item.skill.name),
        languages: mentor.skills
          .filter((item) => item.skill.type === 'LANGUAGE')
          .map((item) => item.skill.name),

        bio: mentor.bio ?? '', // bio này phải được tóm tắt lại để cho vào embedding
        approvalStatus: profile?.approvalStatus ?? 'INCOMPLETE',
        coachingPlans: profile?.coachingPlans.map((plan) => plan.title) ?? [],

        availableSlots: mentor.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          recurrentType: slot.recurrentType,
          recurrentUntil: slot.recurrentUntil,
          isActive: slot.isActive,
        })),
      };
    });
  }
}
