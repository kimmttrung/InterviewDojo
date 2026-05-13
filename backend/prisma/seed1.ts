import 'dotenv/config';
import {
  PrismaClient,
  Role,
  SlotStatus,
  BookingStatus,
  ApprovalStatus,
  UserStatus,
  CoachingQuestionType,
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
  console.log('🌱 Seeding updated booking test data...');

  // 1. Tạo Category cho Coaching (Bắt buộc theo schema mới)
  const category = await prisma.coachingCategory.upsert({
    where: { slug: 'system-design' },
    update: {},
    create: {
      slug: 'system-design',
      name: 'System Design',
      description: 'Master large scale system architecture',
      isActive: true,
    },
  });

  // 2. Mentor (active & approved)
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@example.com' },
    update: {},
    create: {
      email: 'mentor@example.com',
      password: '$2b$10$hashed_placeholder',
      name: 'Mentor Alpha',
      role: Role.MENTOR,
      status: UserStatus.ACTIVE,
      mentorProfile: {
        create: {
          headline: 'Senior Software Engineer & Interview Coach',
          approvalStatus: ApprovalStatus.ACTIVE,
        },
      },
    },
    include: { mentorProfile: true },
  });

  const mentorId = mentor.id;
  const mentorProfileId = mentor.mentorProfile!.id;

  // 3. Candidate
  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@example.com' },
    update: {},
    create: {
      email: 'candidate@example.com',
      password: '$2b$10$hashed_placeholder',
      name: 'Candidate Beta',
      role: Role.CANDIDATE,
      status: UserStatus.ACTIVE,
    },
  });

  // 4. Coaching plan gắn với Category
  const coachingPlan = await prisma.coachingPlan.create({
    data: {
      mentorId: mentorProfileId,
      categoryId: category.id, // Gắn category vừa tạo
      title: 'Mock Interview: System Design',
      description: 'Practice system design interview for senior roles',
      duration: 60,
      price: 50,
      isActive: true,
      questions: {
        create: [
          {
            question: 'What specific topic would you like to focus on?',
            type: CoachingQuestionType.TEXT,
            isRequired: true,
            orderIndex: 1,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // 5. Slots & Bookings

  // CASE 1: PENDING booking
  const slotPending = await prisma.slot.create({
    data: {
      mentorId: mentorId,
      startTime: new Date('2026-06-01T09:00:00Z'),
      endTime: new Date('2026-06-01T10:00:00Z'),
      status: SlotStatus.AVAILABLE,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slotPending.id,
      mentorId: mentorId,
      candidateId: candidate.id,
      coachingPlanId: coachingPlan.id,
      // Mapping dữ liệu snapshot từ plan
      snapshotPlanTitle: coachingPlan.title,
      snapshotPlanDescription: coachingPlan.description,
      snapshotPlanPrice: coachingPlan.price,
      snapshotPlanDuration: coachingPlan.duration,
      // Theo schema mới, Booking cũng cần startTime/endTime
      startTime: slotPending.startTime,
      endTime: slotPending.endTime,
      status: BookingStatus.PENDING,
      answers: {
        create: {
          questionId: coachingPlan.questions[0].id,
          answerText:
            'I want to practice database sharding and caching strategies',
        },
      },
    },
  });

  // CASE 2: ACCEPTED booking (Slot phải chuyển sang BOOKED)
  const slotAccepted = await prisma.slot.create({
    data: {
      mentorId: mentorId,
      startTime: new Date('2026-06-02T10:00:00Z'),
      endTime: new Date('2026-06-02T11:00:00Z'),
      status: SlotStatus.BOOKED,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slotAccepted.id,
      mentorId: mentorId,
      candidateId: candidate.id,
      coachingPlanId: coachingPlan.id,
      snapshotPlanTitle: coachingPlan.title,
      snapshotPlanDescription: coachingPlan.description,
      snapshotPlanPrice: coachingPlan.price,
      snapshotPlanDuration: coachingPlan.duration,
      startTime: slotAccepted.startTime,
      endTime: slotAccepted.endTime,
      status: BookingStatus.ACCEPTED,
    },
  });

  // CASE 3: REJECTED booking (Slot vẫn AVAILABLE)
  const slotRejected = await prisma.slot.create({
    data: {
      mentorId: mentorId,
      startTime: new Date('2026-06-03T14:00:00Z'),
      endTime: new Date('2026-06-03T15:00:00Z'),
      status: SlotStatus.AVAILABLE,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slotRejected.id,
      mentorId: mentorId,
      candidateId: candidate.id,
      coachingPlanId: coachingPlan.id,
      snapshotPlanTitle: coachingPlan.title,
      startTime: slotRejected.startTime,
      endTime: slotRejected.endTime,
      status: BookingStatus.REJECTED,
    },
  });

  console.log(
    '✅ Seed completed: Categories, Plans, Slots and Bookings created.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
