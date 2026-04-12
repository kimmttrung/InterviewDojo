import 'dotenv/config';
import { PrismaClient, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Giống hệt PrismaService trong NestJS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Đang seed Coding Questions...');

  const helloWorld = await prisma.codingQuestion.upsert({
    where: { slug: 'hello-world' },
    update: {},
    create: {
      title: 'Hello World',
      slug: 'hello-world',
      description: `<p>In ra màn hình dòng chữ <code>Hello, World!</code></p>`,
      difficulty: Difficulty.EASY,
      isPublished: true,
      timeLimit: 2000,
      memoryLimit: 256000,
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        codingQuestionId: helloWorld.id,
        input: '',
        expectedOutput: 'Hello, World!',
        isSample: true,
        order: 1,
      },
    ],
    skipDuplicates: true,
  });

  const sumTwo = await prisma.codingQuestion.upsert({
    where: { slug: 'sum-two-numbers' },
    update: {},
    create: {
      title: 'Tổng hai số',
      slug: 'sum-two-numbers',
      description: `
        <p>Đọc 2 số nguyên <code>a</code> và <code>b</code> (mỗi số 1 dòng). In ra tổng.</p>
        <pre>Input:\n3\n5\n\nOutput:\n8</pre>
      `,
      difficulty: Difficulty.EASY,
      isPublished: true,
      timeLimit: 2000,
      memoryLimit: 256000,
    },
  });

  await prisma.testCase.createMany({
    data: [
      { codingQuestionId: sumTwo.id, input: '3\n5',     expectedOutput: '8',   isSample: true,  order: 1 },
      { codingQuestionId: sumTwo.id, input: '0\n0',     expectedOutput: '0',   isSample: true,  order: 2 },
      { codingQuestionId: sumTwo.id, input: '100\n200', expectedOutput: '300', isSample: false, order: 3 },
    ],
    skipDuplicates: true,
  });

  const fizzBuzz = await prisma.codingQuestion.upsert({
    where: { slug: 'fizzbuzz' },
    update: {},
    create: {
      title: 'FizzBuzz',
      slug: 'fizzbuzz',
      description: `
        <p>Đọc số nguyên <code>n</code>. In từ 1 đến n:</p>
        <ul>
          <li>Chia hết 3 → <code>Fizz</code></li>
          <li>Chia hết 5 → <code>Buzz</code></li>
          <li>Chia hết cả 3 và 5 → <code>FizzBuzz</code></li>
          <li>Còn lại → in số đó</li>
        </ul>
      `,
      difficulty: Difficulty.EASY,
      isPublished: true,
      timeLimit: 2000,
      memoryLimit: 256000,
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        codingQuestionId: fizzBuzz.id,
        input: '5',
        expectedOutput: '1\n2\nFizz\n4\nBuzz',
        isSample: true,
        order: 1,
      },
      {
        codingQuestionId: fizzBuzz.id,
        input: '15',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        isSample: false,
        order: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed thành công!');
  console.log(`   - Hello World  (ID: ${helloWorld.id})`);
  console.log(`   - Tổng hai số  (ID: ${sumTwo.id})`);
  console.log(`   - FizzBuzz     (ID: ${fizzBuzz.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // nhớ đóng pool
  });