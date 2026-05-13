import 'dotenv/config';
import {
  PrismaClient,
  Role,
  SlotStatus,
  BookingStatus,
  ApprovalStatus,
  UserStatus,
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
  console.log('🌱 Seeding booking test data for mentor...');

  // 1. Mentor (active & approved)
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@example.com' },
    update: {},
    create: {
      email: 'mentor@example.com',
      password: '$2b$10$hashed_placeholder', // trong thực tế dùng bcrypt, có thể để dummy
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

  // 2. Candidate
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

  // 3. Coaching plan with a text question
  const coachingPlan = await prisma.coachingPlan.create({
    data: {
      mentorId: mentorProfileId,
      title: 'Mock Interview: System Design',
      description: 'Practice system design interview for senior roles',
      duration: 60,
      price: 50,
      isActive: true,
      questions: {
        create: [
          {
            question: 'What specific topic would you like to focus on?',
            type: 'TEXT',
            isRequired: true,
            orderIndex: 1,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // 4. Slots & Bookings

  // Slot 2 hours for PENDING booking
  const slotPending = await prisma.slot.create({
    data: {
      mentorId: mentorId,
      startTime: new Date('2026-06-01T09:00:00Z'),
      endTime: new Date('2026-06-01T11:00:00Z'),
      status: SlotStatus.AVAILABLE,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slotPending.id,
      mentorId: mentorId,
      candidateId: candidate.id,
      coachingPlanId: coachingPlan.id,
      snapshotPlanTitle: coachingPlan.title,
      snapshotPlanDescription: coachingPlan.description,
      snapshotPlanPrice: coachingPlan.price,
      snapshotPlanDuration: coachingPlan.duration,
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

  // Slot already BOOKED for ACCEPTED booking
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
      status: BookingStatus.ACCEPTED,
    },
  });

  // Slot AVAILABLE for REJECTED booking
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
      status: BookingStatus.REJECTED,
    },
  });

  console.log(
    '✅ Seed1 completed: mentor, candidate, slots and bookings (PENDING, ACCEPTED, REJECTED)',
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
