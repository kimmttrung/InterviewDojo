import 'dotenv/config';
import { PrismaClient, Role, ApprovalStatus, SkillType, SkillLevel, SlotStatus, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  // Xóa dữ liệu cũ
  await prisma.payment.deleteMany();
  await prisma.bookingActionLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.coachingPlanAnswer.deleteMany();
  await prisma.coachingPlanQuestion.deleteMany();
  await prisma.coachingPlan.deleteMany();
  await prisma.coachingCategory.deleteMany();
  await prisma.mentorApprovalLog.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  // ===== ADMIN =====
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', password: passwordHash, name: 'Admin', role: Role.ADMIN }
  });

  // ===== MENTOR 1 =====
  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@example.com', password: passwordHash, name: 'Nguyen Van A',
      bio: 'Senior Software Engineer with 10+ years at Google', experienceYears: 10,
      role: Role.MENTOR
    }
  });
  const mentor1Profile = await prisma.mentorProfile.create({
    data: { userId: mentor1.id, headline: 'Senior Software Engineer @ Google · System Design Expert', approvalStatus: ApprovalStatus.ACTIVE }
  });

  // ===== MENTOR 2 =====
  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@example.com', password: passwordHash, name: 'Tran Thi B',
      bio: 'Ex-Amazon Product Manager, expert in Behavioral & Career Coaching', experienceYears: 8,
      role: Role.MENTOR
    }
  });
  const mentor2Profile = await prisma.mentorProfile.create({
    data: { userId: mentor2.id, headline: 'Product Manager @ Amazon · Career Coach', approvalStatus: ApprovalStatus.ACTIVE }
  });

  // ===== MENTOR 3 =====
  const mentor3 = await prisma.user.create({
    data: {
      email: 'mentor3@example.com', password: passwordHash, name: 'Le Van C',
      bio: 'Full-stack developer, 5 years experience, expert in React & Node.js', experienceYears: 5,
      role: Role.MENTOR
    }
  });
  const mentor3Profile = await prisma.mentorProfile.create({
    data: { userId: mentor3.id, headline: 'Senior Full-stack Developer · React/Node.js Expert', approvalStatus: ApprovalStatus.ACTIVE }
  });

  // ===== CANDIDATE =====
  const candidate1 = await prisma.user.create({
    data: { email: 'candidate1@example.com', password: passwordHash, name: 'Pham Van D', role: Role.CANDIDATE }
  });
  const candidate2 = await prisma.user.create({
    data: { email: 'candidate2@example.com', password: passwordHash, name: 'Hoang Thi E', role: Role.CANDIDATE }
  });

  // ===== SKILLS =====
  const skillReact = await prisma.skill.create({ data: { name: 'React', type: SkillType.HARDSKILL } });
  const skillNode = await prisma.skill.create({ data: { name: 'Node.js', type: SkillType.HARDSKILL } });
  const skillSystemDesign = await prisma.skill.create({ data: { name: 'System Design', type: SkillType.HARDSKILL } });
  const skillPM = await prisma.skill.create({ data: { name: 'Product Management', type: SkillType.SOFTSKILL } });
  const skillCareer = await prisma.skill.create({ data: { name: 'Career Coaching', type: SkillType.SOFTSKILL } });

  await prisma.userSkill.createMany({
    data: [
      { userId: mentor1.id, skillId: skillSystemDesign.id, level: SkillLevel.EXPERT, experienceMonths: 120 },
      { userId: mentor2.id, skillId: skillPM.id, level: SkillLevel.EXPERT, experienceMonths: 96 },
      { userId: mentor2.id, skillId: skillCareer.id, level: SkillLevel.PRODUCTION_READY, experienceMonths: 48 },
      { userId: mentor3.id, skillId: skillReact.id, level: SkillLevel.EXPERT, experienceMonths: 60 },
      { userId: mentor3.id, skillId: skillNode.id, level: SkillLevel.PRODUCTION_READY, experienceMonths: 60 },
    ]
  });

  // ===== COACHING CATEGORIES =====
  const categoriesData = [
    { slug: 'resume-review', name: 'Review CV' },
    { slug: 'mock-interview', name: 'Mock Interview' },
    { slug: 'system-design', name: 'System Design' },
    { slug: 'behavioral', name: 'Behavioral Interview' },
    { slug: 'technical', name: 'Technical Interview' },
    { slug: 'career-coaching', name: 'Career Coaching' },
  ];
  const categories: any[] = [];
  for (const cat of categoriesData) {
    categories.push(await prisma.coachingCategory.create({ data: cat }));
  }

  // ===== COACHING PLANS =====
  const plans = [
    { mentorId: mentor1Profile.id, categoryId: categories[2].id, title: 'System Design Mock (45 phút)', duration: 45, price: 200000 },
    { mentorId: mentor1Profile.id, categoryId: categories[2].id, title: 'System Design Deep Dive (90 phút)', duration: 90, price: 350000 },
    { mentorId: mentor2Profile.id, categoryId: categories[5].id, title: 'Career Coaching 1‑1 (30 phút)', duration: 30, price: 150000 },
    { mentorId: mentor2Profile.id, categoryId: categories[3].id, title: 'Behavioral Interview Prep (60 phút)', duration: 60, price: 180000 },
    { mentorId: mentor3Profile.id, categoryId: categories[4].id, title: 'Technical Interview React (45 phút)', duration: 45, price: 180000 },
    { mentorId: mentor3Profile.id, categoryId: categories[0].id, title: 'Review CV & Portfolio (30 phút)', duration: 30, price: 100000 },
  ];
  const createdPlans: any[] = [];
  for (const plan of plans) {
    createdPlans.push(await prisma.coachingPlan.create({ data: plan }));
  }

  // ===== SLOTS =====
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const slots = await prisma.slot.createMany({
    data: [
      { mentorId: mentor1.id, startTime: new Date(tomorrow.setHours(9,0,0)), endTime: new Date(tomorrow.setHours(9,45,0)), status: SlotStatus.AVAILABLE },
      { mentorId: mentor1.id, startTime: new Date(tomorrow.setHours(10,0,0)), endTime: new Date(tomorrow.setHours(10,45,0)), status: SlotStatus.AVAILABLE },
      { mentorId: mentor2.id, startTime: new Date(tomorrow.setHours(14,0,0)), endTime: new Date(tomorrow.setHours(15,0,0)), status: SlotStatus.AVAILABLE },
      { mentorId: mentor3.id, startTime: new Date(tomorrow.setHours(8,0,0)), endTime: new Date(tomorrow.setHours(9,0,0)), status: SlotStatus.AVAILABLE },
    ]
  });

  console.log('✅ Seed data completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());