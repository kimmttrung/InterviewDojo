import 'dotenv/config';
import { PrismaClient, WalletTransactionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('🌱 Bắt đầu seed 10,000,000 VND cho Candidate...');

  const candidateEmail = 'main.candidate@test.com';
  const depositAmount = 10000000; // 10 triệu

  // 1. Tìm candidate
  const user = await prisma.user.findUnique({
    where: { email: candidateEmail },
  });

  if (!user) {
    throw new Error(
      `❌ Không tìm thấy user với email: ${candidateEmail}. Vui lòng chạy seed user trước.`,
    );
  }

  const balanceBefore = user.creditBalance;
  const balanceAfter = balanceBefore + depositAmount;

  // 2. Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu:
  // Vừa cập nhật số dư, vừa tạo lịch sử giao dịch
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { creditBalance: balanceAfter },
    }),
    prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: WalletTransactionType.DEPOSIT,
        amount: depositAmount,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        referenceId: 'SEED_INITIAL_DEPOSIT', // Mã tham chiếu đánh dấu đây là tiền seed
      },
    }),
  ]);

  console.log('✅ Seed tiền thành công!');
  console.log('--------------------------------------------------');
  console.log(`👤 User: ${candidateEmail}`);
  console.log(`💵 Số dư cũ: ${balanceBefore.toLocaleString('vi-VN')} VND`);
  console.log(`💵 Số dư mới: ${balanceAfter.toLocaleString('vi-VN')} VND`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
