import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  ApprovalStatus,
  CoachingQuestionType,
  PrismaClient,
  Role,
  SkillLevel,
  SkillType,
  SlotStatus,
  SlotRecurrentType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor.demo@gmail.com' },
    update: {},
    create: {
      email: 'mentor.demo@gmail.com',
      password,
      name: 'Nguyễn Văn Mentor',
      role: Role.MENTOR,
      bio: 'Senior Backend Developer với kinh nghiệm phỏng vấn và mentor ứng viên junior/mid-level.',
      experienceYears: 5,
      avatarUrl:
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      creditBalance: 0,
    },
  });

  await prisma.user.upsert({
    where: { email: 'candidate.demo@gmail.com' },
    update: {
      creditBalance: 1000000,
    },
    create: {
      email: 'candidate.demo@gmail.com',
      password,
      name: 'Candidate Demo',
      role: Role.CANDIDATE,
      bio: 'Ứng viên đang luyện phỏng vấn backend.',
      creditBalance: 1000000,
    },
  });

  const mentorProfile = await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {
      headline: 'Senior Backend Mentor | NestJS | System Design',
      approvalStatus: ApprovalStatus.ACTIVE,
      introductionVideoUrl:
        'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    create: {
      userId: mentorUser.id,
      headline: 'Senior Backend Mentor | NestJS | System Design',
      approvalStatus: ApprovalStatus.ACTIVE,
      introductionVideoUrl:
        'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  });

  const company = await prisma.company.upsert({
    where: { name: 'FPT Software' },
    update: {},
    create: {
      name: 'FPT Software',
      industry: 'Software Outsourcing',
      logoUrl: null,
    },
  });

  const jobRole = await prisma.jobRole.upsert({
    where: { name: 'Backend Developer' },
    update: {},
    create: {
      name: 'Backend Developer',
      description: 'Develop backend APIs and system architecture.',
    },
  });

  await prisma.experience.create({
    data: {
      mentorId: mentorProfile.id,
      companyId: company.id,
      jobRoleId: jobRole.id,
      description:
        'Thiết kế API, review code, tối ưu database, phỏng vấn backend developer.',
      startDate: new Date('2021-01-01'),
      endDate: null,
      isCurrent: true,
    },
  });

  const skills = [
    { name: 'NestJS', type: SkillType.HARDSKILL, level: SkillLevel.PRODUCTION_READY, months: 36 },
    { name: 'PostgreSQL', type: SkillType.HARDSKILL, level: SkillLevel.PRODUCTION_READY, months: 30 },
    { name: 'System Design', type: SkillType.HARDSKILL, level: SkillLevel.PRACTICED, months: 24 },
    { name: 'Communication', type: SkillType.SOFTSKILL, level: SkillLevel.EXPERT, months: 60 },
    { name: 'Interview Coaching', type: SkillType.SOFTSKILL, level: SkillLevel.EXPERT, months: 48 },
  ];

  for (const item of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        type: item.type,
      },
    });

    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: mentorUser.id,
          skillId: skill.id,
        },
      },
      update: {
        level: item.level,
        experienceMonths: item.months,
      },
      create: {
        userId: mentorUser.id,
        skillId: skill.id,
        level: item.level,
        experienceMonths: item.months,
      },
    });
  }

  const plan = await prisma.coachingPlan.create({
    data: {
      mentorId: mentorProfile.id,
      title: 'Mock Interview Backend 1:1',
      description:
        'Phỏng vấn thử backend, review câu trả lời, góp ý roadmap cải thiện.',
      duration: 60,
      price: 200000,
      isActive: true,
      questions: {
        create: [
          {
            question: 'Bạn đang ứng tuyển vị trí nào?',
            type: CoachingQuestionType.TEXT,
            placeholder: 'Ví dụ: Junior Backend Developer',
            isRequired: true,
            orderIndex: 1,
          },
          {
            question: 'Bạn muốn mentor tập trung đánh giá phần nào?',
            type: CoachingQuestionType.TEXT,
            placeholder: 'Ví dụ: NestJS, SQL, System Design...',
            isRequired: true,
            orderIndex: 2,
          },
          {
            question: 'Link CV/GitHub nếu có',
            type: CoachingQuestionType.TEXT,
            placeholder: 'Dán link CV hoặc GitHub',
            isRequired: false,
            orderIndex: 3,
          },
        ],
      },
    },
  });

  const now = new Date();

  await prisma.slot.createMany({
    data: [
      {
        mentorId: mentorUser.id,
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        status: SlotStatus.AVAILABLE,
        recurrentType: SlotRecurrentType.NONE,
      },
      {
        mentorId: mentorUser.id,
        startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 49 * 60 * 60 * 1000),
        status: SlotStatus.AVAILABLE,
        recurrentType: SlotRecurrentType.NONE,
      },
      {
        mentorId: mentorUser.id,
        startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 73 * 60 * 60 * 1000),
        status: SlotStatus.AVAILABLE,
        recurrentType: SlotRecurrentType.NONE,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed mentor demo thành công');
  console.log('Mentor:', mentorUser.email, 'password: 123456');
  console.log('Candidate: candidate.demo@gmail.com password: 123456');
  console.log('Plan ID:', plan.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });