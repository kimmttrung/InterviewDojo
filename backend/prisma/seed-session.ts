import 'dotenv/config';
import {
  PrismaClient,
  Role,
  BookingStatus,
  SessionStatus,
  SessionSource,
  SessionMode,
  MatchStatus,
  MatchStrategy,
  CoachingQuestionType,
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
  console.log(
    '🌱 Bắt đầu seed dữ liệu cho trang Quản lý Phiên học (Session Management)...',
  );

  const passwordHash = await bcrypt.hash('123456', 10);

  // =====================================================================
  // 1. TẠO USERS (CANDIDATE CHÍNH, MENTOR, VÀ PEER CANDIDATE)
  // =====================================================================

  // 1.1 Candidate chính (Người dùng để đăng nhập kiểm thử)
  const mainCandidate = await prisma.user.upsert({
    where: { email: 'main.candidate@test.com' },
    update: {},
    create: {
      email: 'main.candidate@test.com',
      password: passwordHash,
      name: 'Nguyễn Văn Candidate',
      role: Role.CANDIDATE,
      avatarUrl: 'https://i.pravatar.cc/150?u=main',
    },
  });

  // 1.2 Mentor
  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor.expert@test.com' },
    update: {},
    create: {
      email: 'mentor.expert@test.com',
      password: passwordHash,
      name: 'Trần Mentor (Expert)',
      role: Role.MENTOR,
      avatarUrl: 'https://i.pravatar.cc/150?u=mentor',
      mentorProfile: {
        create: {
          headline: 'Senior Software Engineer tại TechCorp',
          approvalStatus: 'ACTIVE',
        },
      },
    },
  });

  // Lấy Mentor Profile ID
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUser.id },
  });

  if (!mentorProfile) {
    throw new Error('Không tìm thấy hồ sơ Mentor vừa tạo');
  }

  // 1.3 Peer Candidate (Dành cho P2P Session)
  const peerCandidate = await prisma.user.upsert({
    where: { email: 'peer.candidate@test.com' },
    update: {},
    create: {
      email: 'peer.candidate@test.com',
      password: passwordHash,
      name: 'Lê Peer Candidate',
      role: Role.CANDIDATE,
      avatarUrl: 'https://i.pravatar.cc/150?u=peer',
    },
  });

  // =====================================================================
  // 2. TẠO CATEGORY & COACHING PLAN
  // =====================================================================

  // Thực hiện upsert danh mục câu hỏi lõi
  await prisma.category.upsert({
    where: { name: 'System Design Interview' },
    update: {},
    create: { name: 'System Design Interview' },
  });

  // Thực hiện upsert danh mục cho gói coaching
  const coachingCategory = await prisma.coachingCategory.upsert({
    where: { slug: 'system-design' },
    update: {},
    create: { slug: 'system-design', name: 'System Design', isActive: true },
  });

  const coachingPlan = await prisma.coachingPlan.create({
    data: {
      mentorId: mentorProfile.id,
      categoryId: coachingCategory.id,
      title: 'Mock Interview: System Design (1-on-1)',
      description: 'Đánh giá năng lực thiết kế hệ thống của bạn.',
      duration: 60,
      price: 500000,
      questions: {
        create: [
          {
            question: 'Bạn muốn tập trung vào dạng hệ thống nào?',
            type: CoachingQuestionType.TEXT,
            isRequired: true,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // FIX LỖI: Lấy phần tử của mảng câu hỏi thay vì lấy trực tiếp .id trên mảng
  const questionId = coachingPlan.questions[0]?.id;

  // =====================================================================
  // 3. TẠO CÁC KỊCH BẢN PHIÊN HỌC (SCENARIOS) ĐỂ TEST UI
  // =====================================================================

  const now = new Date();

  // --- Kịch bản 1: UPCOMING (Sắp diễn ra trong 15 phút -> Nút Join SÁNG LÊN) ---
  const timeIn15Mins = new Date(now.getTime() + 15 * 60000);
  const timeIn75Mins = new Date(now.getTime() + 75 * 60000);

  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: timeIn15Mins,
      endTime: timeIn75Mins,
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.ACCEPTED,
      answers: {
        create: [
          {
            questionId,
            answerText:
              'Tôi muốn thiết kế hệ thống chat real-time (như Messenger)',
          },
        ],
      },
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: timeIn15Mins,
            durationMinutes: 60,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/test-upcoming',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // --- Kịch bản 2: PENDING (Đang chờ Mentor xác nhận) ---
  const timeTomorrow = new Date(now.getTime() + 24 * 60 * 60000);

  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: timeTomorrow,
      endTime: new Date(timeTomorrow.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.PENDING_ACCEPTANCE,
      answers: {
        create: [{ questionId, answerText: 'Thiết kế hệ thống E-commerce' }],
      },
    },
  });

  // --- Kịch bản 3: REJECTED (Bị Mentor từ chối kèm Lý do hiển thị Modal) ---
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: timeTomorrow,
      endTime: new Date(timeTomorrow.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.REJECTED,
      logs: {
        create: [
          {
            actorId: mentorUser.id,
            action: 'REJECT_BOOKING',
            note: 'Xin lỗi, khung giờ này tôi vừa có lịch họp đột xuất ở công ty. Bạn vui lòng chọn khung giờ khác nhé!',
          },
        ],
      },
    },
  });

  // --- Kịch bản 4: FINISHED (Đã hoàn thành, có feedback, link recording và nút report) ---
  const timeYesterday = new Date(now.getTime() - 24 * 60 * 60000);

  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: timeYesterday,
      endTime: new Date(timeYesterday.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.COMPLETED,
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: timeYesterday,
            startedAt: timeYesterday,
            endedAt: new Date(timeYesterday.getTime() + 60 * 60000),
            durationMinutes: 60,
            status: SessionStatus.COMPLETED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            recordingUrl: 'https://zoom.us/rec/play/dummy-link-123',
            meetSession: { create: {} },
            feedbacks: {
              create: [
                {
                  reviewerId: mentorUser.id,
                  revieweeId: mainCandidate.id,
                  strengths: [
                    'Giao tiếp tốt',
                    'Nắm vững kiến trúc Microservices',
                  ],
                  weaknesses: ['Tính toán capacity chưa chính xác'],
                  suggestions: ['Nên ôn lại cách ước tính QPS và Storage'],
                  overallScore: 4.5,
                  comment: 'Bạn làm khá tốt, tiếp tục phát huy!',
                  status: 'SUBMITTED', // FIX LỖI: Truyền trực tiếp chuỗi chữ thay vì enum chưa sync
                  deadline: now,
                  submittedAt: new Date(
                    timeYesterday.getTime() + 2 * 60 * 60000,
                  ),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // --- Kịch bản 5: UPCOMING P2P SESSION (Trạng thái đối kháng đồng hành) ---
  const timeIn2Days = new Date(now.getTime() + 48 * 60 * 60000);

  await prisma.match.create({
    data: {
      candidateAId: mainCandidate.id,
      candidateBId: peerCandidate.id,
      status: MatchStatus.MATCHED,
      strategy: MatchStrategy.RANDOM,
      matchedAt: now,
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: timeIn2Days,
            durationMinutes: 45,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.P2P_MATCH,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/test-p2p',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // --- Kịch bản 6: FINISHED SOLO SESSION (Tự luyện tập với AI) ---
  await prisma.mockSession.create({
    data: {
      intervieweeId: mainCandidate.id,
      scheduledAt: new Date(now.getTime() - 48 * 60 * 60000),
      durationMinutes: 30,
      status: SessionStatus.COMPLETED,
      source: SessionSource.SOLO,
      mode: SessionMode.SOLO,
      soloSession: { create: { script: { text: 'Hello AI' } } },
    },
  });

  console.log('✅ Seed dữ liệu Quản lý Phiên học thành công!');
  console.log('--------------------------------------------------');
  console.log(
    '👤 Tài khoản kiểm thử Candidate: main.candidate@test.com / 123456',
  );
  console.log('👤 Tài khoản kiểm thử Mentor: mentor.expert@test.com / 123456');
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
