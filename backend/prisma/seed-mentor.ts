import 'dotenv/config';
import {
  PrismaClient,
  Role,
  ApprovalStatus,
  SkillType,
  SkillLevel,
} from '@prisma/client';
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
  const passwordHash = await bcrypt.hash('123456', 10);

  // Xóa dữ liệu cũ (tùy chọn)
  await prisma.userSkill.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.coachingPlan.deleteMany({}); // Thêm xóa CoachingPlan nếu có
  await prisma.coachingCategory.deleteMany({}); // Thêm xóa CoachingCategory
  await prisma.mentorProfile.deleteMany({});
  await prisma.user.deleteMany({ where: { role: Role.MENTOR } });
  await prisma.skill.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.jobRole.deleteMany({});

  // ==================== TẠO COACHING CATEGORIES ====================
  const coachingCategoriesData = [
    {
      slug: 'technical-interview',
      name: 'Technical Interview Prep',
      description:
        'Mock interviews focusing on Data Structures, Algorithms, and live coding.',
    },
    {
      slug: 'system-design',
      name: 'System Design Prep',
      description:
        'Deep dives into scalable architecture, distributed systems, and design trade-offs.',
    },
    {
      slug: 'behavioral-interview',
      name: 'Behavioral & Culture Fit',
      description:
        'Mastering the STAR method and answering leadership principle questions.',
    },
    {
      slug: 'resume-review',
      name: 'Resume & Profile Review',
      description:
        'Actionable feedback on your resume, LinkedIn profile, and GitHub portfolio.',
    },
    {
      slug: 'career-mentorship',
      name: 'Career Strategy & Mentorship',
      description:
        'Long-term guidance for career growth, job transitions, and salary negotiation.',
    },
    {
      slug: 'leadership-coaching',
      name: 'Leadership Coaching',
      description:
        'Mentorship for transitioning from Senior Engineer to Tech Lead or Engineering Manager.',
    },
  ];

  const categories = await Promise.all(
    coachingCategoriesData.map((c) =>
      prisma.coachingCategory.create({ data: c }),
    ),
  );
  console.log(`✅ Seeded ${categories.length} coaching categories!`);

  // ==================== TẠO SKILLS ====================
  const skillsData = [
    { name: 'React', type: SkillType.HARDSKILL },
    { name: 'Node.js', type: SkillType.HARDSKILL },
    { name: 'System Design', type: SkillType.HARDSKILL },
    { name: 'Product Management', type: SkillType.SOFTSKILL },
    { name: 'Career Coaching', type: SkillType.SOFTSKILL },
    { name: 'Python', type: SkillType.HARDSKILL },
    { name: 'Java', type: SkillType.HARDSKILL },
    { name: 'AWS', type: SkillType.HARDSKILL },
    { name: 'Communication', type: SkillType.SOFTSKILL },
    { name: 'Leadership', type: SkillType.SOFTSKILL },
    { name: 'Docker', type: SkillType.HARDSKILL },
    { name: 'Kubernetes', type: SkillType.HARDSKILL },
    { name: 'TypeScript', type: SkillType.HARDSKILL },
    { name: 'Go', type: SkillType.HARDSKILL },
    { name: 'Ruby', type: SkillType.HARDSKILL },
    { name: 'C++', type: SkillType.HARDSKILL },
    { name: 'Machine Learning', type: SkillType.HARDSKILL },
    { name: 'Data Analysis', type: SkillType.HARDSKILL },
    { name: 'UX Design', type: SkillType.HARDSKILL },
    { name: 'Agile', type: SkillType.SOFTSKILL },
  ];
  const skills = await Promise.all(
    skillsData.map((s) => prisma.skill.create({ data: s })),
  );

  // ==================== TẠO COMPANIES ====================
  const companiesData = [
    {
      name: 'Google',
      logoUrl: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Microsoft',
      logoUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Amazon',
      logoUrl: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
      industry: 'E-commerce',
    },
    {
      name: 'Meta',
      logoUrl: 'https://www.google.com/s2/favicons?domain=meta.com&sz=128',
      industry: 'Social Media',
    },
    {
      name: 'Apple',
      logoUrl: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Netflix',
      logoUrl: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128',
      industry: 'Entertainment',
    },
    {
      name: 'Stripe',
      logoUrl: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128',
      industry: 'Fintech',
    },
    {
      name: 'Shopify',
      logoUrl: 'https://www.google.com/s2/favicons?domain=shopify.com&sz=128',
      industry: 'E-commerce',
    },
    {
      name: 'Spotify',
      logoUrl: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=128',
      industry: 'Music',
    },
    {
      name: 'Airbnb',
      logoUrl: 'https://www.google.com/s2/favicons?domain=airbnb.com&sz=128',
      industry: 'Travel',
    },
    {
      name: 'Uber',
      logoUrl: 'https://www.google.com/s2/favicons?domain=uber.com&sz=128',
      industry: 'Transportation',
    },
    {
      name: 'Twitter',
      logoUrl: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=128',
      industry: 'Social Media',
    },
    {
      name: 'LinkedIn',
      logoUrl: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Salesforce',
      logoUrl:
        'https://www.google.com/s2/favicons?domain=salesforce.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Adobe',
      logoUrl: 'https://www.google.com/s2/favicons?domain=adobe.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Slack',
      logoUrl: 'https://www.google.com/s2/favicons?domain=slack.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Zoom',
      logoUrl: 'https://www.google.com/s2/favicons?domain=zoom.us&sz=128',
      industry: 'Technology',
    },
    {
      name: 'PayPal',
      logoUrl: 'https://www.google.com/s2/favicons?domain=paypal.com&sz=128',
      industry: 'Fintech',
    },
    {
      name: 'Square',
      logoUrl: 'https://www.google.com/s2/favicons?domain=square.com&sz=128',
      industry: 'Fintech',
    },
    {
      name: 'Coinbase',
      logoUrl: 'https://www.google.com/s2/favicons?domain=coinbase.com&sz=128',
      industry: 'Cryptocurrency',
    },
    {
      name: 'Robinhood',
      logoUrl: 'https://www.google.com/s2/favicons?domain=robinhood.com&sz=128',
      industry: 'Fintech',
    },
    {
      name: 'Nvidia',
      logoUrl: 'https://www.google.com/s2/favicons?domain=nvidia.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Intel',
      logoUrl: 'https://www.google.com/s2/favicons?domain=intel.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'AMD',
      logoUrl: 'https://www.google.com/s2/favicons?domain=amd.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Tesla',
      logoUrl: 'https://www.google.com/s2/favicons?domain=tesla.com&sz=128',
      industry: 'Automotive',
    },
    {
      name: 'SpaceX',
      logoUrl: 'https://www.google.com/s2/favicons?domain=spacex.com&sz=128',
      industry: 'Aerospace',
    },
    {
      name: 'ByteDance',
      logoUrl: 'https://www.google.com/s2/favicons?domain=bytedance.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Tencent',
      logoUrl: 'https://www.google.com/s2/favicons?domain=tencent.com&sz=128',
      industry: 'Technology',
    },
    {
      name: 'Alibaba',
      logoUrl: 'https://www.google.com/s2/favicons?domain=alibaba.com&sz=128',
      industry: 'E-commerce',
    },
  ];
  const companies = await Promise.all(
    companiesData.map((c) => prisma.company.create({ data: c })),
  );

  // ==================== TẠO JOB ROLES ====================
  const rolesData = [
    { name: 'Software Engineer' },
    { name: 'Product Manager' },
    { name: 'Engineering Manager' },
    { name: 'Data Scientist' },
    { name: 'UX Designer' },
    { name: 'DevOps Engineer' },
    { name: 'QA Engineer' },
    { name: 'Technical Writer' },
    { name: 'Scrum Master' },
    { name: 'Solutions Architect' },
  ];
  const roles = await Promise.all(
    rolesData.map((r) => prisma.jobRole.create({ data: r })),
  );

  // ==================== TẠO MENTORS ====================
  const mentorTemplates = [
    {
      name: 'Nguyen Van A',
      email: 'mentor.a@test.com',
      bio: 'Senior Software Engineer with 10+ years at Google. Expert in System Design and React.',
      headline: 'Senior Software Engineer @ Google · System Design Expert',
    },
    {
      name: 'Tran Thi B',
      email: 'mentor.b@test.com',
      bio: 'Ex-Amazon Product Manager. I help candidates crack FAANG interviews.',
      headline: 'Product Manager @ Amazon · Career Coach',
    },
    {
      name: 'Le Van C',
      email: 'mentor.c@test.com',
      bio: 'Full-stack developer, 5 years at Microsoft. Passionate about teaching React and Node.js.',
      headline:
        'Senior Full-stack Developer @ Microsoft · React/Node.js Expert',
    },
    {
      name: 'Pham Quoc D',
      email: 'mentor.d@test.com',
      bio: 'Data Scientist at Meta. 8 years experience in Machine Learning and AI.',
      headline: 'Data Scientist @ Meta · AI/ML Expert',
    },
    {
      name: 'Hoang Thi E',
      email: 'mentor.e@test.com',
      bio: 'Engineering Manager at Stripe. I can help you grow into a leadership role.',
      headline: 'Engineering Manager @ Stripe · Leadership Coach',
    },
    {
      name: 'Vu Van F',
      email: 'mentor.f@test.com',
      bio: 'UX Designer at Airbnb. 7 years creating delightful user experiences.',
      headline: 'Senior UX Designer @ Airbnb · Design Thinking',
    },
    {
      name: 'Ly Thi G',
      email: 'mentor.g@test.com',
      bio: 'DevOps Engineer at Netflix. Expert in AWS, Docker, and CI/CD pipelines.',
      headline: 'DevOps Engineer @ Netflix · Cloud Infrastructure',
    },
    {
      name: 'Mai Van H',
      email: 'mentor.h@test.com',
      bio: 'Software Engineer at Apple. Passionate about Swift and iOS development.',
      headline: 'iOS Developer @ Apple · Swift Expert',
    },
    {
      name: 'Do Thi I',
      email: 'mentor.i@test.com',
      bio: 'Quality Assurance Lead at Salesforce. 12 years ensuring top-notch software quality.',
      headline: 'QA Lead @ Salesforce · Test Automation',
    },
    {
      name: 'Bui Van J',
      email: 'mentor.j@test.com',
      bio: 'Data Engineer at Spotify. Big data, Spark, and Kafka enthusiast.',
      headline: 'Data Engineer @ Spotify · Big Data Expert',
    },
    {
      name: 'Nguyen Thi K',
      email: 'mentor.k@test.com',
      bio: 'Scrum Master at LinkedIn. Agile coach with 10 years experience.',
      headline: 'Scrum Master @ LinkedIn · Agile Coach',
    },
    {
      name: 'Tran Van L',
      email: 'mentor.l@test.com',
      bio: 'Solutions Architect at Uber. Microservices and cloud-native architecture.',
      headline: 'Solutions Architect @ Uber · Cloud Native',
    },
    {
      name: 'Le Thi M',
      email: 'mentor.m@test.com',
      bio: 'Product Designer at Adobe. Creating seamless design systems.',
      headline: 'Product Designer @ Adobe · Design Systems',
    },
    {
      name: 'Pham Van N',
      email: 'mentor.n@test.com',
      bio: 'Backend Developer at Shopify. Ruby on Rails and PostgreSQL expert.',
      headline: 'Backend Developer @ Shopify · Ruby Expert',
    },
    {
      name: 'Hoang Van O',
      email: 'mentor.o@test.com',
      bio: 'Frontend Developer at Twitter. React and GraphQL specialist.',
      headline: 'Frontend Developer @ Twitter · React Expert',
    },
    {
      name: 'Vu Thi P',
      email: 'mentor.p@test.com',
      bio: 'Data Analyst at Square. Turning data into actionable insights.',
      headline: 'Data Analyst @ Square · Insights Expert',
    },
    {
      name: 'Ly Van Q',
      email: 'mentor.q@test.com',
      bio: 'Security Engineer at Coinbase. Keeping crypto assets safe.',
      headline: 'Security Engineer @ Coinbase · Blockchain Security',
    },
    {
      name: 'Mai Thi R',
      email: 'mentor.r@test.com',
      bio: 'Engineering Manager at Robinhood. Building high-performing teams.',
      headline: 'Engineering Manager @ Robinhood · Team Builder',
    },
    {
      name: 'Do Van S',
      email: 'mentor.s@test.com',
      bio: 'AI Researcher at Nvidia. Deep learning and computer vision.',
      headline: 'AI Researcher @ Nvidia · Deep Learning',
    },
    {
      name: 'Bui Thi T',
      email: 'mentor.t@test.com',
      bio: 'Game Developer at Tencent. Unreal Engine and game design.',
      headline: 'Game Developer @ Tencent · Unreal Engine',
    },
    {
      name: 'Nguyen Van U',
      email: 'mentor.u@test.com',
      bio: 'Embedded Systems Engineer at Intel. IoT and firmware development.',
      headline: 'Embedded Engineer @ Intel · IoT Expert',
    },
    {
      name: 'Tran Thi V',
      email: 'mentor.v@test.com',
      bio: 'Cloud Architect at Alibaba. Multi-cloud strategy and migration.',
      headline: 'Cloud Architect @ Alibaba · Multi-Cloud',
    },
    {
      name: 'Le Van W',
      email: 'mentor.w@test.com',
      bio: 'Full-stack Developer at Zoom. WebRTC and real-time communication.',
      headline: 'Full-stack Developer @ Zoom · Real-Time Comms',
    },
    {
      name: 'Pham Thi X',
      email: 'mentor.x@test.com',
      bio: 'Mobile Developer at Meta. React Native and cross-platform apps.',
      headline: 'Mobile Developer @ Meta · React Native',
    },
    {
      name: 'Hoang Van Y',
      email: 'mentor.y@test.com',
      bio: 'ML Engineer at Tesla. Autopilot and neural networks.',
      headline: 'ML Engineer @ Tesla · Autonomous Driving',
    },
    {
      name: 'Vu Thi Z',
      email: 'mentor.z@test.com',
      bio: 'Technical Writer at Stripe. Making complex APIs simple.',
      headline: 'Technical Writer @ Stripe · API Documentation',
    },
    {
      name: 'Ly Van AA',
      email: 'mentor.aa@test.com',
      bio: 'Backend Developer at PayPal. Secure payment systems.',
      headline: 'Backend Developer @ PayPal · Payment Systems',
    },
    {
      name: 'Mai Thi BB',
      email: 'mentor.bb@test.com',
      bio: 'Frontend Developer at ByteDance. Vue.js and large-scale apps.',
      headline: 'Frontend Developer @ ByteDance · Vue Expert',
    },
    {
      name: 'Do Van CC',
      email: 'mentor.cc@test.com',
      bio: 'Data Scientist at AMD. Performance analysis and optimization.',
      headline: 'Data Scientist @ AMD · Performance Analysis',
    },
    {
      name: 'Bui Thi DD',
      email: 'mentor.dd@test.com',
      bio: 'Software Engineer at SpaceX. Mission-critical software for rockets.',
      headline: 'Software Engineer @ SpaceX · Aerospace Software',
    },
  ];

  const createMentor = async (
    name: string,
    email: string,
    bio: string,
    headline: string,
  ) => {
    const user = await prisma.user.create({
      data: { email, password: passwordHash, name, bio, role: Role.MENTOR },
    });
    const profile = await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        headline,
        approvalStatus: ApprovalStatus.ACTIVE,
      },
    });
    return { user, profile };
  };

  for (let i = 0; i < mentorTemplates.length; i++) {
    const m = mentorTemplates[i];
    const { user, profile } = await createMentor(
      m.name,
      m.email,
      m.bio,
      m.headline,
    );

    // Thêm 1-2 experiences
    const numExp = 1 + (i % 2);
    for (let j = 0; j < numExp; j++) {
      const companyIdx = (i * 3 + j) % companies.length;
      const roleIdx = (i * 2 + j) % roles.length;
      await prisma.experience.create({
        data: {
          mentorId: profile.id,
          companyId: companies[companyIdx].id,
          jobRoleId: roles[roleIdx].id,
          isCurrent: j === 0,
          startDate: new Date(2020, j * 12, 1),
          description: `Worked at ${companies[companyIdx].name} as ${roles[roleIdx].name}`,
        },
      });
    }

    // Thêm 3-7 skills
    const numSkills = 3 + (i % 5);
    const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(0, numSkills);
    for (const skill of selectedSkills) {
      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          level: [
            SkillLevel.LEARNING,
            SkillLevel.PRACTICED,
            SkillLevel.PRODUCTION_READY,
            SkillLevel.EXPERT,
          ][i % 4],
          experienceMonths: 12 + Math.floor(Math.random() * 60),
        },
      });
    }

    // (Tùy chọn bổ sung thêm): Tạo luôn 1-2 Coaching Plan ngẫu nhiên cho mỗi mentor
    // liên kết với danh mục vừa tạo ở trên để bạn có data test luôn.
    const numPlans = 1 + (i % 2);
    for (let p = 0; p < numPlans; p++) {
      const categoryIdx = (i + p) % categories.length;
      await prisma.coachingPlan.create({
        data: {
          mentorId: profile.id,
          categoryId: categories[categoryIdx].id,
          title: `1-on-1 ${categories[categoryIdx].name} Session`,
          description: `I will help you with ${categories[categoryIdx].name.toLowerCase()} and share my industry experience.`,
          duration: 60, // 60 phút
          price: 50.0 + (i % 5) * 10, // $50 - $90
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Seed ${mentorTemplates.length} mentors completed!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
