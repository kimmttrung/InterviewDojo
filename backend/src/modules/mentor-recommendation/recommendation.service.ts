// src/modules/mentor-recommendation/recommendation.service.ts
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

  /**
   * HÀM CHÍNH GỢI Ý MENTOR: Chỉ đọc từ bảng Cache giúp tăng tốc độ phản hồi vượt bậc
   */
  async recommend(candidateId: number, limit = 10) {
    // 1. Kiểm tra dữ liệu trong bảng Cache thiết lập index trước đó
    const cachedData = await this.prisma.candidateRecommendation.findMany({
      where: { candidateId },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        mentor: {
          include: {
            skills: { include: { skill: true } },
            mentorProfile: {
              include: {
                experiences: {
                  where: { isCurrent: true },
                  take: 1,
                  include: { company: true, jobRole: true },
                },
              },
            },
          },
        },
      },
    });

    // 2. Dự phòng (Fallback): Nếu ứng viên mới tinh chưa có Cache, tính realtime tạm thời hoặc lấy Top Mentor mặc định
    if (cachedData.length === 0) {
      await this.calculateAndCacheRecommendations(candidateId);
      return this.recommend(candidateId, limit); // Đệ quy đọc lại sau khi vừa tạo cache xong
    }

    // 3. Định dạng dữ liệu trả ra tương thích chuẩn giao diện Frontend
    return cachedData.map((cache) => ({
      id: cache.mentor.id,
      name: cache.mentor.name,
      avatarUrl: cache.mentor.avatarUrl,
      bio: cache.mentor.bio,
      experienceYears: cache.mentor.experienceYears,
      skills: cache.mentor.skills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        type: us.skill.type,
        level: us.level,
        experienceMonths: us.experienceMonths,
      })),
      mentorProfile: cache.mentor.mentorProfile
        ? {
            headline: cache.mentor.mentorProfile.headline,
            experiences: cache.mentor.mentorProfile.experiences,
          }
        : null,
      recommendationScore: cache.score,
    }));
  }

  /**
   * HÀM WORKER CHẠY NGẦM: Tính toán toàn bộ ma trận điểm số và ghi đè vào bảng Cache
   */
  async calculateAndCacheRecommendations(candidateId: number): Promise<void> {
    const candidate = await this.loadCandidate(candidateId);
    const mentors = await this.loadMentors();

    // Lọc cứng các điều kiện tiên quyết
    const filteredMentors = this.hardFilter.filter(candidate, mentors);

    const rankingResult = filteredMentors.map((mentor) => {
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

      // Tính toán độ tương thích vị trí công việc đích (Target Role Score)
      const targetRole = this.targetRoleScore.calculateBestRoleScore(
        candidate.role,
        mentor.rawRoles,
      );

      const finalScore = this.ranking.rank({
        semantic,
        skill,
        experience,
        language,
        availability,
        targetRole,
        finalScore: 0,
      });

      return {
        mentorId: mentor.id,
        recommendationScore: finalScore,
      };
    });

    // Sắp xếp thứ hạng điểm số từ cao xuống thấp
    const top10Result = rankingResult
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10);

    // Lưu trữ hàng loạt vào Cache Table sử dụng transaction nhằm tối ưu hóa I/O DB
    await this.prisma.$transaction([
      // Xóa bảng cache cũ của candidate này
      this.prisma.candidateRecommendation.deleteMany({
        where: { candidateId },
      }),
      // Ghi đè ma trận điểm số xếp hạng mới
      this.prisma.candidateRecommendation.createMany({
        data: top10Result.map((item, index) => ({
          candidateId,
          mentorId: item.mentorId,
          score: item.recommendationScore,
          rank: index + 1,
        })),
      }),
    ]);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS (Giữ nguyên cấu trúc phân tách dữ liệu của bạn)
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

    return {
      id: candidate.id,
      embedding: this.parseVector(embeddingRaw[0]?.emb),
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
      this.prisma.$queryRaw<{ id: number; emb: string }[]>`
        SELECT id, embedding_vector::text AS emb
        FROM users
        WHERE role = 'MENTOR'
      `,
    ]);

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
