import 'dotenv/config';
import { PrismaClient, Difficulty, QuestionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

// ================= DATA THEORIES (Updated Structure) =================
const theoryQuestions = [
  // 1. BEHAVIORAL
  {
    title: 'Self Introduction',
    slug: 'tell-me-about-yourself',
    difficulty: Difficulty.EASY,
    type: QuestionType.BEHAVIORAL,
    categories: ['Soft Skills', 'HR'],
    data: {
      question: 'Tell me about yourself.',
      followUps: [
        'What experience is most relevant to this role?',
        'How did you get into software engineering?',
      ],
      tips: [
        'Use the Present–Past–Future structure.',
        'Keep it under 2 minutes and tie your story to the role.',
        'Avoid reading your resume — synthesize it.',
      ],
      keyPoints: [
        'Clear narrative arc (past → present → future)',
        'Mentions relevant technical background',
        'Shows enthusiasm for the role',
        'Concise and well-structured',
      ],
    },
  },
  {
    title: 'Conflict Resolution',
    slug: 'conflict-resolution',
    difficulty: Difficulty.MEDIUM,
    type: QuestionType.BEHAVIORAL,
    categories: ['Soft Skills', 'Leadership'],
    data: {
      question:
        'Describe a time you had a conflict with a colleague. How did you handle it?',
      followUps: [
        'What would you do differently now?',
        'How do you handle feedback you disagree with?',
      ],
      tips: [
        'Use the STAR method (Situation, Task, Action, Result).',
        'Focus on the resolution and professional growth, not the drama.',
        'Demonstrate emotional intelligence and empathy.',
      ],
      keyPoints: [
        'Identifies a specific professional situation',
        'Shows proactive communication',
        'Resulted in a positive or constructive outcome',
      ],
    },
  },

  // 2. SYSTEM DESIGN
  {
    title: 'Designing a URL Shortener',
    slug: 'design-url-shortener',
    difficulty: Difficulty.MEDIUM,
    type: QuestionType.SYSTEM_DESIGN,
    categories: ['System Design', 'Backend'],
    data: {
      question: 'How would you design a URL shortening service like Bitly?',
      followUps: [
        'How do you handle custom aliases?',
        'What database would you choose for high-scale reads?',
        'How to prevent predictable URLs?',
      ],
      tips: [
        'Start with requirement clarification (Read/Write ratio).',
        'Discuss API design and data models.',
        'Explain the hashing mechanism vs. base-62 encoding.',
      ],
      keyPoints: [
        'Mentions Load Balancer and Caching (Redis)',
        'Scalability of the shortening algorithm',
        'Handling database partitioning/sharding',
      ],
    },
  },

  // 3. TECHNICAL
  {
    title: 'React Lifecycle & Hooks',
    slug: 'react-lifecycle-hooks',
    difficulty: Difficulty.MEDIUM,
    type: QuestionType.TECHNICAL,
    categories: ['Frontend', 'React'],
    data: {
      question:
        'Explain the React component lifecycle and how Hooks replace class methods.',
      followUps: [
        'What is the difference between useEffect and useLayoutEffect?',
        'How do you optimize performance with useMemo or useCallback?',
      ],
      tips: [
        'Relate Hooks like useEffect to componentDidMount/Update.',
        'Mention the "Rules of Hooks".',
        'Explain why functional components are preferred now.',
      ],
      keyPoints: [
        'Correct understanding of the Virtual DOM',
        'Explains side-effect management',
        'Understands dependency arrays in Hooks',
      ],
    },
  },
  {
    title: 'Microservices vs Monolith',
    slug: 'microservices-vs-monolith',
    difficulty: Difficulty.HARD,
    type: QuestionType.TECHNICAL,
    categories: ['Architecture', 'Backend'],
    data: {
      question:
        'Compare Microservices and Monolithic architectures. When should we switch?',
      followUps: [
        'How do services communicate (REST vs gRPC vs Message Queue)?',
        'What is a Distributed Transaction (Saga pattern)?',
      ],
      tips: [
        'Focus on the trade-offs: complexity vs. scalability.',
        'Mention "The Fallacies of Distributed Computing".',
        "Don't just say Microservices are always better.",
      ],
      keyPoints: [
        'Deployment independence',
        'Fault tolerance and isolation',
        'Operational complexity (CI/CD, Monitoring)',
      ],
    },
  },
];

async function main() {
  console.log(
    `🌱 Seeding ${theoryQuestions.length} theory questions with new JSON structure...\n`,
  );

  for (const tq of theoryQuestions) {
    // 1. Upsert Categories
    for (const catName of tq.categories) {
      await prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      });
    }

    // 2. Upsert Question Core
    const question = await prisma.question.upsert({
      where: { slug: tq.slug },
      update: {
        title: tq.title,
        difficulty: tq.difficulty,
        type: tq.type,
        isPublished: true,
      },
      create: {
        title: tq.title,
        slug: tq.slug,
        difficulty: tq.difficulty,
        type: tq.type,
        isPublished: true,
      },
    });

    // 3. Upsert TheoryQuestion Detail (JSON structure: question, followUps, tips, keyPoints)
    await prisma.theoryQuestion.upsert({
      where: { questionId: question.id },
      update: { data: tq.data as any },
      create: {
        questionId: question.id,
        data: tq.data as any,
      },
    });

    // 4. Link Categories (Junction Table)
    await prisma.questionCategory.deleteMany({
      where: { questionId: question.id },
    });

    for (const catName of tq.categories) {
      const category = await prisma.category.findUnique({
        where: { name: catName },
      });
      if (category) {
        await prisma.questionCategory.create({
          data: {
            questionId: question.id,
            categoryId: category.id,
          },
        });
      }
    }
  }

  console.log('✅ Theory Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
