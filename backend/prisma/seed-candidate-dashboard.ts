import {
  BookingStatus,
  PrismaClient,
  QuestionType,
  SessionMode,
  SessionSource,
  SessionStatus,
} from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const userId = 3;

  // =====================================================
  // CATEGORY
  // =====================================================

  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        name: 'System Design',
      },
      update: {},
      create: {
        name: 'System Design',
      },
    }),

    prisma.category.upsert({
      where: {
        name: 'Backend',
      },
      update: {},
      create: {
        name: 'Backend',
      },
    }),

    prisma.category.upsert({
      where: {
        name: 'Database',
      },
      update: {},
      create: {
        name: 'Database',
      },
    }),

    prisma.category.upsert({
      where: {
        name: 'React',
      },
      update: {},
      create: {
        name: 'React',
      },
    }),

    prisma.category.upsert({
      where: {
        name: 'Algorithms',
      },
      update: {},
      create: {
        name: 'Algorithms',
      },
    }),
  ]);

  // =====================================================
  // QUESTIONS + BOOKMARKS
  // =====================================================

  for (let i = 1; i <= 15; i++) {
    const question = await prisma.question.create({
      data: {
        title: `Question ${i}`,

        slug: `question-${Date.now()}-${i}`,

        type: QuestionType.TECHNICAL,

        isPublished: true,
      },
    });

    const randomCategory = categories[i % categories.length];

    await prisma.questionCategory.create({
      data: {
        questionId: question.id,

        categoryId: randomCategory.id,
      },
    });

    await prisma.userBookmark.create({
      data: {
        userId,

        questionId: question.id,
      },
    });
  }

  // =====================================================
  // UPCOMING BOOKINGS
  // =====================================================

  for (let i = 1; i <= 3; i++) {
    const mentor = await prisma.user.create({
      data: {
        email: `mentor${Date.now()}${i}@gmail.com`,

        password: '123456',

        name: `Mentor ${i}`,

        role: 'MENTOR',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        mentorId: mentor.id,

        candidateId: userId,

        coachingPlanId: 1,

        startTime: new Date(Date.now() + i * 1000 * 60 * 60 * 24),

        endTime: new Date(
          Date.now() + i * 1000 * 60 * 60 * 24 + 1000 * 60 * 60,
        ),

        snapshotPlanTitle: 'Senior Backend Interview',

        status: BookingStatus.ACCEPTED,
      },
    });

    // =====================================================
    // MOCK SESSION
    // =====================================================

    const session = await prisma.mockSession.create({
      data: {
        bookingId: booking.id,

        intervieweeId: userId,

        scheduledAt: booking.startTime,

        durationMinutes: 60,

        status: SessionStatus.COMPLETED,

        source: SessionSource.MENTOR_BOOKING,

        mode: SessionMode.MEET,
      },
    });

    // =====================================================
    // FEEDBACK
    // =====================================================

    await prisma.feedback.create({
      data: {
        sessionId: session.id,

        reviewerId: mentor.id,

        revieweeId: userId,

        strengths: ['Good problem solving', 'Strong backend knowledge'],

        weaknesses: ['Communication', 'English fluency'],

        suggestions: ['Practice mock interviews', 'Improve behavioral answers'],

        overallScore: 6 + Math.random() * 4,

        comment: 'Good candidate overall',
      },
    });
  }

  // =====================================================
  // SOLO SESSIONS
  // =====================================================

  for (let i = 1; i <= 5; i++) {
    const session = await prisma.mockSession.create({
      data: {
        intervieweeId: userId,

        scheduledAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24),

        durationMinutes: 45,

        status: SessionStatus.COMPLETED,

        source: SessionSource.SOLO,

        mode: SessionMode.SOLO,
      },
    });

    await prisma.feedback.create({
      data: {
        sessionId: session.id,

        revieweeId: userId,

        strengths: ['Logical thinking'],

        weaknesses: ['Slow response'],

        suggestions: ['Train faster thinking'],

        overallScore: 5 + Math.random() * 4,

        comment: 'AI evaluated session',
      },
    });
  }

  // =====================================================
  // CODE SUBMISSIONS
  // =====================================================

  for (let i = 1; i <= 20; i++) {
    const question = await prisma.question.create({
      data: {
        title: `Coding ${i}`,

        slug: `coding-${Date.now()}-${i}`,

        type: QuestionType.CODING,

        isPublished: true,

        codingQuestion: {
          create: {
            description: 'Solve this problem',

            hints: [],

            tags: ['array'],
          },
        },
      },
    });

    await prisma.codeSubmission.create({
      data: {
        userId,

        codingQuestionId: question.id,

        languageId: '71',

        language: 'python',

        sourceCode: 'print("hello")',

        status: 'ACCEPTED',

        verdict: 'Accepted',

        score: 70 + Math.random() * 30,
      },
    });
  }

  console.log('✅ Candidate dashboard seed completed');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
