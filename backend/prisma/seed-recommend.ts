import 'dotenv/config';
import {
  PrismaClient,
  Role,
  ApprovalStatus,
  SkillLevel,
  SkillType,
  SlotRecurrentType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Queue } from 'bullmq'; // 👈 Import trực tiếp BullMQ vào đây

// 1. Khởi tạo Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// 2. Khởi tạo kết nối tới Redis cho BullMQ
const redisOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};
const embeddingQueue = new Queue('embedding-queue', {
  connection: redisOptions,
});

// ==========================================
// UTILS: HÀM RANDOM DATA
// ==========================================
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const FIRST_NAMES = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Huỳnh',
  'Phan',
  'Vũ',
  'Võ',
  'Đặng',
  'Bùi',
];
const MID_NAMES = [
  'Văn',
  'Thị',
  'Thanh',
  'Minh',
  'Hải',
  'Ngọc',
  'Quang',
  'Hữu',
  'Đức',
  'Thùy',
];
const LAST_NAMES = [
  'Hảo',
  'Bình',
  'Phúc',
  'Linh',
  'Trang',
  'Hùng',
  'Cường',
  'Nam',
  'An',
  'Khoa',
];

const HEADLINES = [
  'Senior Software Engineer',
  'Lead Backend Developer',
  'Data Scientist',
  'Frontend Architect',
  'Fullstack Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Solutions Architect',
];

async function main() {
  console.log(
    '🌱 Bắt đầu tạo 50 Mentors và đẩy Job tính toán Vector vào BullMQ...',
  );

  // 1. DỌN DẸP DỮ LIỆU CŨ
  console.log('🧹 Đang dọn dẹp dữ liệu test cũ...');
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: '@dojo.com' } },
    select: { id: true },
  });
  const testUserIds = testUsers.map((u) => u.id);

  if (testUserIds.length > 0) {
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { mentorId: { in: testUserIds } },
          { candidateId: { in: testUserIds } },
        ],
      },
    });
    await prisma.userSkill.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.mentorProfile.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.slot.deleteMany({ where: { mentorId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  }

  // 2. KHỞI TẠO METADATA TỰ ĐỘNG (Upsert)
  console.log('📦 Đang chuẩn bị Metadata...');
  const baseSkills = [
    'React',
    'Node.js',
    'TypeScript',
    'Python',
    'Java',
    'System Design',
    'Go',
    'AWS',
  ];
  const dbSkills = await Promise.all(
    baseSkills.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, type: SkillType.HARDSKILL },
      }),
    ),
  );

  const baseCompanies = [
    'Google',
    'Meta',
    'Amazon',
    'VNG',
    'FPT Software',
    'Shopee',
  ];
  const dbCompanies = await Promise.all(
    baseCompanies.map((name) =>
      prisma.company.upsert({
        where: { name },
        update: {},
        create: { name, industry: 'Technology' },
      }),
    ),
  );

  const baseRoles = [
    'Software Engineer',
    'Data Scientist',
    'Frontend Engineer',
    'Backend Engineer',
    'DevOps Engineer',
  ];
  const dbRoles = await Promise.all(
    baseRoles.map((name) =>
      prisma.jobRole.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const techCategory = await prisma.coachingCategory.upsert({
    where: { slug: 'technical-interview' },
    update: {},
    create: {
      name: 'Technical Interview',
      slug: 'technical-interview',
      description: 'Phỏng vấn kỹ thuật',
    },
  });

  // 3. TẠO CANDIDATE VÀ XẾP HÀNG TÍNH VECTOR
  console.log('👤 Đang tạo Candidate test...');
  const candidate = await prisma.user.create({
    data: {
      email: 'candidate.test@dojo.com',
      name: 'Bùi Trung Thanh (Candidate)',
      password: '$2b$10$pFhkcRtJ72Aq9Og2rLjjtu.LcSQcjKLkZlXhn1X5n8HN0eKPKriWm',
      role: Role.CANDIDATE,
      experienceYears: 2,
      targetRoleId: dbRoles[0].id,
      skills: {
        create: [
          {
            skillId: dbSkills[0].id,
            level: SkillLevel.FOUNDATION,
            experienceMonths: 18,
          },
          {
            skillId: dbSkills[1].id,
            level: SkillLevel.FOUNDATION,
            experienceMonths: 12,
          },
        ],
      },
    },
  });

  // 🚀 Đẩy Candidate vào BullMQ để hệ thống tự gọi API/Python tính Embedding
  await embeddingQueue.add(
    'process-candidate',
    { candidateId: candidate.id },
    {
      jobId: `seed-candidate-embedding-${candidate.id}`,
      removeOnComplete: true,
    },
  );

  // 4. VÒNG LẶP TẠO 50 MENTORS
  console.log('🚀 Đang tạo 50 Mentors và xếp hàng xử lý Vector...');
  const MENTOR_COUNT = 50;

  for (let i = 1; i <= MENTOR_COUNT; i++) {
    const fullName = `${randomItem(FIRST_NAMES)} ${randomItem(MID_NAMES)} ${randomItem(LAST_NAMES)}`;
    const expYears = randomInt(3, 12);

    // Create User & Profile
    const mentor = await prisma.user.create({
      data: {
        email: `mentor${i}@dojo.com`,
        name: fullName,
        password:
          '$2b$10$pFhkcRtJ72Aq9Og2rLjjtu.LcSQcjKLkZlXhn1X5n8HN0eKPKriWm',
        role: Role.MENTOR,
        experienceYears: expYears,
        bio: `Xin chào, mình là ${fullName}. Mình có ${expYears} năm kinh nghiệm.`,
        mentorProfile: {
          create: {
            headline: randomItem(HEADLINES),
            approvalStatus: ApprovalStatus.ACTIVE,
          },
        },
      },
      include: { mentorProfile: true },
    });

    const mentorProfileId = mentor.mentorProfile!.id;

    // Skills
    const mentorSkills = randomItems(dbSkills, randomInt(3, 5));
    await prisma.userSkill.createMany({
      data: mentorSkills.map((s) => ({
        userId: mentor.id,
        skillId: s.id,
        level: randomItem([
          SkillLevel.AUTONOMOUS,
          SkillLevel.FLUENT,
          SkillLevel.LEADERSHIP,
        ]),
        experienceMonths: randomInt(24, expYears * 12),
      })),
    });

    // Experiences
    const mentorComps = randomItems(dbCompanies, randomInt(1, 3));
    const mentorJobRoles = randomItems(dbRoles, mentorComps.length);
    for (let j = 0; j < mentorComps.length; j++) {
      const isCurrent = j === 0;
      await prisma.experience.create({
        data: {
          mentorId: mentorProfileId,
          companyId: mentorComps[j].id,
          jobRoleId: mentorJobRoles[j].id,
          isCurrent: isCurrent,
          startDate: new Date(
            new Date().getFullYear() - randomInt(1, expYears),
            randomInt(0, 11),
            1,
          ),
          endDate: isCurrent
            ? null
            : new Date(new Date().getFullYear() - 1, randomInt(0, 11), 1),
        },
      });
    }

    // Coaching Plan
    await prisma.coachingPlan.create({
      data: {
        mentorId: mentorProfileId,
        categoryId: techCategory.id,
        title: `Mock Interview 1-1: ${randomItem(['System Design', 'Coding', 'Behavioral'])}`,
        duration: randomItem([45, 60, 90]),
        price: randomItem([200000, 350000, 500000]),
        isActive: true,
      },
    });

    // Slots
    const slotsData = Array.from({ length: randomInt(5, 10) }).map(() => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + randomInt(1, 7));
      startTime.setHours(randomInt(8, 20), 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      return {
        mentorId: mentor.id,
        startTime,
        endTime,
        isActive: true,
        recurrentType: SlotRecurrentType.NONE,
      };
    });
    await prisma.slot.createMany({ data: slotsData });

    // 🚀 BẮT ĐẦU ĐIỀU KỲ DIỆU TẠI ĐÂY
    // Đẩy Mentor vừa tạo vào thẳng Queue thay vì chèn Vector ảo
    await embeddingQueue.add(
      'process-mentor',
      { mentorId: mentor.id },
      {
        jobId: `seed-mentor-embedding-${mentor.id}`,
        removeOnComplete: true,
      },
    );
  }

  console.log('🎉 Đã Seed xong 50 Mentors!');
  console.log(
    '⏳ Bạn hãy bật server NestJS lên, BullMQ Worker sẽ tự động nuốt 51 Jobs này và gọi API/Python để lưu Vector thật vào Database.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Lỗi trong quá trình Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await embeddingQueue.close(); // Đóng kết nối Redis an toàn
    await prisma.$disconnect();
  });
