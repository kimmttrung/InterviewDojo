import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { RecommendationService } from '../recommendation.service';
import { Role, SkillLevel, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🚀 Đang khởi động NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const prisma = app.get(PrismaService);
  const recommendationService = app.get(RecommendationService);

  try {
    // ==========================================
    // 1. TẠO CANDIDATE TEST VỚI MẬT KHẨU HASHED
    // ==========================================
    console.log('👤 Đang nạp Candidate Test...');
    const plainPassword = '123456';
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);

    // Lấy Role và các Skills cần thiết từ DB
    const targetRole = await prisma.jobRole.findFirst({
      where: { name: 'Data Scientist' },
    });
    const reactSkill = await prisma.skill.findFirst({
      where: { name: 'React' },
    });
    const nodeSkill = await prisma.skill.findFirst({
      where: { name: 'Node.js' },
    });

    // Tạo hoặc cập nhật thông tin cơ bản của Candidate
    const candidate = await prisma.user.upsert({
      where: { email: 'candidate.eval@dojo.com' },
      update: {
        password: hashedPassword,
        experienceYears: 2,
        targetRoleId: targetRole?.id,
      },
      create: {
        email: 'candidate.eval@dojo.com',
        name: 'Bùi Trung Thanh (Evaluator)',
        password: hashedPassword,
        role: Role.CANDIDATE,
        experienceYears: 2,
        targetRoleId: targetRole?.id,
      },
    });

    // Làm sạch skills cũ và gán lại Skills mới để thuật toán Jaccard chạy chuẩn
    await prisma.userSkill.deleteMany({
      where: { userId: candidate.id },
    });

    const skillsToInsert: Prisma.UserSkillCreateManyInput[] = [];
    if (reactSkill) {
      skillsToInsert.push({
        userId: candidate.id,
        skillId: reactSkill.id,
        level: SkillLevel.FOUNDATION,
        experienceMonths: 18,
      });
    }
    if (nodeSkill) {
      skillsToInsert.push({
        userId: candidate.id,
        skillId: nodeSkill.id,
        level: SkillLevel.FOUNDATION,
        experienceMonths: 12,
      });
    }

    if (skillsToInsert.length > 0) {
      await prisma.userSkill.createMany({ data: skillsToInsert });
    }

    console.log(
      `✅ Đã sẵn sàng Candidate ID: ${candidate.id} (Kèm theo Skills)`,
    );

    // ==========================================
    // 2. GỌI HÀM RECOMMENDATION TỪ SERVICE
    // ==========================================
    console.log('🧠 Đang chạy thuật toán Recommend...');
    const topMentors = await recommendationService.recommend(candidate.id);
    const top5 = topMentors.slice(0, 5); // Lấy Top 5 để đánh giá

    if (top5.length === 0) {
      console.log('⚠️ Không tìm thấy Mentor nào để đánh giá!');
      return;
    }

    // ==========================================
    // 3. XÂY DỰNG "GROUND TRUTH" (Điểm thực tế)
    // ==========================================
    // Giả lập con người chấm điểm các mentor trả về để so sánh với thuật toán
    // Thang điểm: 3 (Rất hợp), 2 (Khá hợp), 1 (Tạm), 0 (Không liên quan)

    console.log('\n📊 BẢNG XẾP HẠNG TRẢ VỀ:');
    const groundTruthScores: number[] = [];

    for (let i = 0; i < top5.length; i++) {
      const mentor = top5[i];

      // -- BẮT ĐẦU LOGIC CHẤM ĐIỂM THỰC TẾ --
      let relevanceScore = 0;

      // Tiêu chí 1: Kinh nghiệm dày dặn hơn candidate (+1 điểm)
      if ((mentor.experienceYears ?? 0) > (candidate.experienceYears ?? 0)) {
        relevanceScore += 1;
      }
      // Tiêu chí 2: Có role trùng khớp hoặc tương đương (+1 điểm)
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: mentor.id },
        include: { experiences: { include: { jobRole: true } } },
      });
      const hasMatchingRole = mentorProfile?.experiences.some(
        (exp) => exp.jobRole?.name === targetRole?.name,
      );
      if (hasMatchingRole) relevanceScore += 1;

      // Tiêu chí 3: Chuyên gia có giá trị (Staff/Lead) (+1 điểm)
      if (
        mentorProfile?.headline?.toLowerCase().includes('senior') ||
        mentorProfile?.headline?.toLowerCase().includes('lead')
      ) {
        relevanceScore += 1;
      }

      // Giới hạn max là 3
      relevanceScore = Math.min(relevanceScore, 3);
      groundTruthScores.push(relevanceScore);

      console.log(
        `[Top ${i + 1}] ID: ${mentor.id} | Tên: ${mentor.name} | Điểm thuật toán: ${mentor.recommendationScore.toFixed(4)} | Điểm Ground Truth: ${relevanceScore}/3`,
      );
    }

    // ==========================================
    // 4. TÍNH TOÁN CÁC CHỈ SỐ NDCG@5 VÀ PRECISION@5
    // ==========================================
    const K = Math.min(5, top5.length);

    // Tính Precision@5 (Ngưỡng relevant >= 2)
    const RELEVANT_THRESHOLD = 2;
    const relevantCount = groundTruthScores.filter(
      (score) => score >= RELEVANT_THRESHOLD,
    ).length;
    const precisionAtK = relevantCount / K;

    // Tính NDCG@5
    let dcg = 0;
    for (let i = 0; i < K; i++) {
      const rel = groundTruthScores[i];
      dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 1 + 1); // log2(i+1) nhưng index bắt đầu từ 0 nên là i+2
    }

    // Tính Ideal DCG (Sắp xếp Ground Truth từ cao xuống thấp)
    const idealScores = [...groundTruthScores].sort((a, b) => b - a);
    let idcg = 0;
    for (let i = 0; i < K; i++) {
      const rel = idealScores[i];
      idcg += (Math.pow(2, rel) - 1) / Math.log2(i + 1 + 1);
    }

    const ndcgAtK = idcg === 0 ? 0 : dcg / idcg;

    // ==========================================
    // 5. IN KẾT QUẢ
    // ==========================================
    console.log('\n📈 KẾT QUẢ ĐÁNH GIÁ THUẬT TOÁN (OFFLINE METRICS):');
    console.log(
      `- Precision@${K}: ${(precisionAtK * 100).toFixed(2)}% (Có ${relevantCount}/${K} Mentor thực sự đáp ứng nhu cầu)`,
    );
    console.log(
      `- NDCG@${K}     : ${(ndcgAtK * 100).toFixed(2)}% (Mức độ sắp xếp chuẩn xác từ ngon nhất đến kém nhất)`,
    );

    if (ndcgAtK > 0.8) {
      console.log(
        '\n🔥 Đánh giá: Thuật toán đang hoạt động RẤT TỐT! Các Mentor xịn nhất đã được đẩy lên đầu.',
      );
    } else {
      console.log(
        '\n⚠️ Đánh giá: Cần tinh chỉnh lại trọng số (Ranking Weights) vì các Mentor kém phù hợp đang chiếm mất vị trí top đầu.',
      );
    }
  } catch (error) {
    console.error('❌ Lỗi trong quá trình chạy script đánh giá:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
