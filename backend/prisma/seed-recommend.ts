import 'dotenv/config';
import { PrismaClient, Role, BookingStatus, SkillLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Đính kèm sslmode=verify-full nếu connection string hỗ trợ để dập tắt warning SSL
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log(
    '🌱 Trực quan hóa dữ liệu hạt giống cho Recommendation System...',
  );

  // 0. Làm sạch dữ liệu kiểm thử cũ để tránh xung đột trùng lặp bản ghi
  await prisma.booking.deleteMany({
    where: { candidate: { email: 'candidate.test@dojo.com' } },
  });
  await prisma.userBookmark.deleteMany({
    where: { user: { email: 'candidate.test@dojo.com' } },
  });
  await prisma.userSkill.deleteMany({
    where: {
      user: {
        email: {
          in: [
            'candidate.test@dojo.com',
            'mentor.perfect@dojo.com',
            'mentor.mid@dojo.com',
            'mentor.miss@dojo.com',
          ],
        },
      },
    },
  });
  await prisma.experience.deleteMany({
    where: {
      mentor: {
        user: {
          email: {
            in: [
              'mentor.perfect@dojo.com',
              'mentor.mid@dojo.com',
              'mentor.miss@dojo.com',
            ],
          },
        },
      },
    },
  });
  await prisma.coachingPlan.deleteMany({
    where: {
      mentor: {
        user: {
          email: {
            in: [
              'mentor.perfect@dojo.com',
              'mentor.mid@dojo.com',
              'mentor.miss@dojo.com',
            ],
          },
        },
      },
    },
  });
  await prisma.slot.deleteMany({
    where: {
      mentor: {
        email: {
          in: [
            'mentor.perfect@dojo.com',
            'mentor.mid@dojo.com',
            'mentor.miss@dojo.com',
          ],
        },
      },
    },
  });
  await prisma.mentorProfile.deleteMany({
    where: {
      user: {
        email: {
          in: [
            'candidate.test@dojo.com',
            'mentor.perfect@dojo.com',
            'mentor.mid@dojo.com',
            'mentor.miss@dojo.com',
          ],
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'candidate.test@dojo.com',
          'mentor.perfect@dojo.com',
          'mentor.mid@dojo.com',
          'mentor.miss@dojo.com',
        ],
      },
    },
  });

  // 1. Thu thập Metadata sẵn có từ hệ thống
  const reactSkill = await prisma.skill.findUnique({
    where: { name: 'React' },
  });
  const nodeSkill = await prisma.skill.findUnique({
    where: { name: 'Node.js' },
  });
  const tsSkill = await prisma.skill.findUnique({
    where: { name: 'TypeScript' },
  });
  const pythonSkill = await prisma.skill.findUnique({
    where: { name: 'Python' },
  });
  const javaSkill = await prisma.skill.findUnique({ where: { name: 'Java' } });
  const sysDesignSkill = await prisma.skill.findUnique({
    where: { name: 'System Design' },
  });

  const sweRole = await prisma.jobRole.findUnique({
    where: { name: 'Software Engineer' },
  });
  const dsRole = await prisma.jobRole.findUnique({
    where: { name: 'Data Scientist' },
  });

  const techCategory = await prisma.coachingCategory.findUnique({
    where: { slug: 'technical-interview' },
  });
  const googleCompany = await prisma.company.findUnique({
    where: { name: 'Google' },
  });

  if (
    !reactSkill ||
    !nodeSkill ||
    !tsSkill ||
    !pythonSkill ||
    !javaSkill ||
    !sysDesignSkill ||
    !sweRole ||
    !techCategory
  ) {
    throw new Error(
      '❌ Hãy chắc chắn rằng bạn đã chạy file seed gốc trước để khởi tạo hệ thống Skill và JobRole!',
    );
  }

  // Giả lập Vector Embedding 1024 chiều
  const baseVector = new Array(1024).fill(0.1);
  const matchedVector = [...baseVector];
  matchedVector[0] = 0.12;

  const unMatchedVector = new Array(1024).fill(-0.1);

  // 2. KHỞI TẠO CANDIDATE KIỂM THỬ
  const candidate = await prisma.user.create({
    data: {
      email: 'candidate.test@dojo.com',
      name: 'Bùi Trung Thanh (Test)',
      password: '$2b$10$pFhkcRtJ72Aq9Og2rLjjtu.LcSQcjKLkZlXhn1X5n8HN0eKPKriWm',
      role: Role.CANDIDATE,
      experienceYears: 2,
      targetRoleId: sweRole.id,
    },
  });

  await prisma.userSkill.createMany({
    data: [
      {
        userId: candidate.id,
        skillId: reactSkill.id,
        level: SkillLevel.FOUNDATION,
        experienceMonths: 18,
      },
      {
        userId: candidate.id,
        skillId: nodeSkill.id,
        level: SkillLevel.FOUNDATION,
        experienceMonths: 12,
      },
      {
        userId: candidate.id,
        skillId: tsSkill.id,
        level: SkillLevel.FOUNDATION,
        experienceMonths: 12,
      },
    ],
  });

  // SỬA TẠI ĐÂY: Ép kiểu vector thuần Postgres (Bỏ cryptopro)
  await prisma.$executeRawUnsafe(
    `UPDATE users SET embedding_vector = '${JSON.stringify(baseVector)}'::vector WHERE id = ${candidate.id}`,
  );

  // 3. KHỞI TẠO MENTOR 1: "Nguyễn Văn Hoàn Hảo" (Match 100%)
  const mentorPerfect = await prisma.user.create({
    data: {
      email: 'mentor.perfect@dojo.com',
      name: 'Nguyễn Văn Hoàn Hảo',
      password: '$2b$10$pFhkcRtJ72Aq9Og2rLjjtu.LcSQcjKLkZlXhn1X5n8HN0eKPKriWm',
      role: Role.MENTOR,
      experienceYears: 6,
      bio: 'Chuyên gia xây dựng hệ thống phần mềm quy mô lớn, thành thục NodeJS và React',
    },
  });
  const profilePerfect = await prisma.mentorProfile.create({
    data: {
      userId: mentorPerfect.id,
      headline: 'Staff Engineer @ TechCorp',
      approvalStatus: 'ACTIVE',
    },
  });
  await prisma.userSkill.createMany({
    data: [
      {
        userId: mentorPerfect.id,
        skillId: reactSkill.id,
        level: SkillLevel.LEADERSHIP,
        experienceMonths: 60,
      },
      {
        userId: mentorPerfect.id,
        skillId: nodeSkill.id,
        level: SkillLevel.FLUENT,
        experienceMonths: 48,
      },
      {
        userId: mentorPerfect.id,
        skillId: tsSkill.id,
        level: SkillLevel.FLUENT,
        experienceMonths: 36,
      },
    ],
  });
  await prisma.experience.create({
    data: {
      mentorId: profilePerfect.id,
      companyId: googleCompany?.id || 1,
      jobRoleId: sweRole.id,
      startDate: new Date(2018, 1, 1),
      isCurrent: true,
    },
  });
  await prisma.slot.create({
    data: {
      mentorId: mentorPerfect.id,
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 90000000),
      isActive: true,
    },
  });

  // SỬA TẠI ĐÂY: Ép kiểu vector thuần Postgres
  await prisma.$executeRawUnsafe(
    `UPDATE users SET embedding_vector = '${JSON.stringify(matchedVector)}'::vector WHERE id = ${mentorPerfect.id}`,
  );

  // 4. KHỞI TẠO MENTOR 2: "Trần Văn Trung Bình" (Match 50%)
  const mentorMid = await prisma.user.create({
    data: {
      email: 'mentor.mid@dojo.com',
      name: 'Trần Văn Trung Bình',
      password: '$2b$10$pFhkcRtJ72Aq9Og2rLjjtu.LcSQcjKLkZlXhn1X5n8HN0eKPKriWm',
      role: Role.MENTOR,
      experienceYears: 4,
      bio: 'Backend Engineer chuyên phát triển API. Biết một chút frontend React',
    },
  });
  const profileMid = await prisma.mentorProfile.create({
    data: {
      userId: mentorMid.id,
      headline: 'Senior Dev',
      approvalStatus: 'ACTIVE',
    },
  });
  await prisma.userSkill.createMany({
    data: [
      {
        userId: mentorMid.id,
        skillId: reactSkill.id,
        level: SkillLevel.AUTONOMOUS,
        experienceMonths: 24,
      },
      {
        userId: mentorMid.id,
        skillId: pythonSkill.id,
        level: SkillLevel.FLUENT,
        experienceMonths: 48,
      },
    ],
  });
  await prisma.slot.create({
    data: {
      mentorId: mentorMid.id,
      startTime: new Date(Date.now() + 172800000),
      endTime: new Date(Date.now() + 176400000),
      isActive: true,
    },
  });

  // SỬA TẠI ĐÂY: Ép kiểu vector thuần Postgres
  await prisma.$executeRawUnsafe(
    `UPDATE users SET embedding_vector = '${JSON.stringify(baseVector)}'::vector WHERE id = ${mentorMid.id}`,
  );

  // 5. KHỞI TẠO MENTOR 3: "Lê Văn Lệch Pha" (Match 0%)
  const mentorMiss = await prisma.user.create({
    data: {
      email: 'mentor.miss@dojo.com',
      name: 'Lê Văn Lệch Pha',
      password: 'password_secured',
      role: Role.MENTOR,
      experienceYears: 8,
      bio: 'Data Scientist chuyên sâu phân tích dữ liệu thuật toán cốt lõi, mô hình AI bằng Java',
    },
  });
  const profileMiss = await prisma.mentorProfile.create({
    data: {
      userId: mentorMiss.id,
      headline: 'Lead Data Scientist',
      approvalStatus: 'ACTIVE',
    },
  });
  await prisma.userSkill.createMany({
    data: [
      {
        userId: mentorMiss.id,
        skillId: javaSkill.id,
        level: SkillLevel.LEADERSHIP,
        experienceMonths: 80,
      },
      {
        userId: mentorMiss.id,
        skillId: sysDesignSkill.id,
        level: SkillLevel.FLUENT,
        experienceMonths: 50,
      },
    ],
  });
  await prisma.slot.create({
    data: {
      mentorId: mentorMiss.id,
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 90000000),
      isActive: true,
    },
  });

  // SỬA TẠI ĐÂY: Ép kiểu vector thuần Postgres
  await prisma.$executeRawUnsafe(
    `UPDATE users SET embedding_vector = '${JSON.stringify(unMatchedVector)}'::vector WHERE id = ${mentorMiss.id}`,
  );

  console.log(
    `🚀 Hoàn tất tạo dữ liệu thử nghiệm! Hãy dùng Candidate ID: ${candidate.id} để test API.`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
