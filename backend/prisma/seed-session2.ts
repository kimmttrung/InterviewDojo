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
  // 1. TẠO USERS
  // =====================================================================

  // Candidate chính
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

  // Mentor
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

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUser.id },
  });
  if (!mentorProfile) throw new Error('Không tìm thấy hồ sơ Mentor');

  // Peer candidate cho P2P
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

  // Second peer cho thêm P2P
  const peerCandidate2 = await prisma.user.upsert({
    where: { email: 'peer2.candidate@test.com' },
    update: {},
    create: {
      email: 'peer2.candidate@test.com',
      password: passwordHash,
      name: 'Phạm Peer Candidate 2',
      role: Role.CANDIDATE,
      avatarUrl: 'https://i.pravatar.cc/150?u=peer2',
    },
  });

  // =====================================================================
  // 2. TẠO CATEGORY & COACHING PLAN
  // =====================================================================
  await prisma.category.upsert({
    where: { name: 'System Design Interview' },
    update: {},
    create: { name: 'System Design Interview' },
  });

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
  const questionId = coachingPlan.questions[0]?.id;

  // =====================================================================
  // 3. THỜI GIAN DỰA TRÊN THỜI GIAN HIỆN TẠI
  // =====================================================================
  const now = new Date();

  // --- UPCOMING (sắp diễn ra) ---
  const in15Mins = new Date(now.getTime() + 15 * 60000); // 15 phút nữa
  const in30Mins = new Date(now.getTime() + 30 * 60000); // 30 phút nữa
  const in1Hour = new Date(now.getTime() + 60 * 60000); // 1 giờ nữa
  const in2Hours = new Date(now.getTime() + 120 * 60000); // 2 giờ nữa
  const in1Day = new Date(now.getTime() + 24 * 60 * 60000); // 1 ngày nữa
  const in2Days = new Date(now.getTime() + 48 * 60 * 60000); // 2 ngày nữa

  // --- PENDING (chờ xác nhận, trong tương lai) ---
  const pendingTime = new Date(now.getTime() + 3 * 60 * 60000); // 3 giờ nữa

  // --- FINISHED (đã kết thúc trong quá khứ) ---
  const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60000);
  const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60000);

  // --- REJECTED (quá khứ) ---
  const rejectedTime = new Date(now.getTime() - 2 * 24 * 60 * 60000);

  // =====================================================================
  // 4. SEED CÁC KỊCH BẢN
  // =====================================================================

  // ---------- MENTOR UPCOMING (trong 15 phút, có meeting link) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: in15Mins,
      endTime: new Date(in15Mins.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.ACCEPTED,
      answers: {
        create: [
          { questionId, answerText: 'Thiết kế hệ thống chat real-time' },
        ],
      },
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: in15Mins,
            durationMinutes: 60,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/test-upcoming-15m',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // ---------- MENTOR UPCOMING (trong 30 phút) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: in30Mins,
      endTime: new Date(in30Mins.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.ACCEPTED,
      answers: {
        create: [{ questionId, answerText: 'Thiết kế hệ thống e-commerce' }],
      },
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: in30Mins,
            durationMinutes: 60,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/test-upcoming-30m',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // ---------- MENTOR UPCOMING (trong 1 giờ, chưa có meeting link) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: in1Hour,
      endTime: new Date(in1Hour.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.ACCEPTED,
      answers: {
        create: [{ questionId, answerText: 'Thiết kế hệ thống thanh toán' }],
      },
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: in1Hour,
            durationMinutes: 60,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            meetingLink: null, // chưa có link
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // ---------- MENTOR PENDING (chờ mentor xác nhận) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: pendingTime,
      endTime: new Date(pendingTime.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.PENDING_ACCEPTANCE,
      answers: {
        create: [{ questionId, answerText: 'Tôi muốn luyện system design' }],
      },
    },
  });

  // ---------- MENTOR REJECTED (có lý do) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: rejectedTime,
      endTime: new Date(rejectedTime.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.REJECTED,
      answers: {
        create: [
          { questionId, answerText: 'Tôi muốn học thiết kế microservices' },
        ],
      },
      logs: {
        create: [
          {
            actorId: mentorUser.id,
            action: 'REJECT_BOOKING',
            note: 'Rất tiếc, tôi bận đột xuất. Bạn vui lòng đặt lịch khác nhé!',
          },
        ],
      },
    },
  });

  // ---------- MENTOR FINISHED (có feedback và recording) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.COMPLETED,
      answers: {
        create: [{ questionId, answerText: 'Tôi đã thiết kế hệ thống chat' }],
      },
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: yesterday,
            startedAt: yesterday,
            endedAt: new Date(yesterday.getTime() + 60 * 60000),
            durationMinutes: 60,
            status: SessionStatus.COMPLETED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            recordingUrl: 'https://zoom.us/rec/play/mentor-finished-session',
            meetSession: { create: {} },
            feedbacks: {
              create: [
                {
                  reviewerId: mentorUser.id,
                  revieweeId: mainCandidate.id,
                  strengths: ['Tư duy logic tốt', 'Nắm vững kiến thức cơ bản'],
                  weaknesses: [
                    'Chưa tối ưu database',
                    'Thiếu kinh nghiệm scale',
                  ],
                  suggestions: ['Đọc thêm về sharding', 'Luyện thêm bài tập'],
                  overallScore: 4.2,
                  comment: 'Khá tốt, cố gắng thêm nhé!',
                  status: 'SUBMITTED',
                  deadline: now,
                  submittedAt: new Date(yesterday.getTime() + 2 * 60 * 60000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ---------- P2P UPCOMING (2 ngày nữa) ----------
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
            scheduledAt: in2Days,
            durationMinutes: 45,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.P2P_MATCH,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/p2p-upcoming',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // ---------- P2P UPCOMING (1 ngày nữa) ----------
  await prisma.match.create({
    data: {
      candidateAId: mainCandidate.id,
      candidateBId: peerCandidate2.id,
      status: MatchStatus.MATCHED,
      strategy: MatchStrategy.RANDOM,
      matchedAt: now,
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: in1Day,
            durationMinutes: 45,
            status: SessionStatus.SCHEDULED,
            source: SessionSource.P2P_MATCH,
            mode: SessionMode.MEET,
            meetingLink: 'https://meet.google.com/p2p-upcoming-2',
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  // ---------- P2P FINISHED (có feedback) ----------
  await prisma.match.create({
    data: {
      candidateAId: mainCandidate.id,
      candidateBId: peerCandidate.id,
      status: MatchStatus.COMPLETED,
      strategy: MatchStrategy.RANDOM,
      matchedAt: twoDaysAgo,
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: twoDaysAgo,
            startedAt: twoDaysAgo,
            endedAt: new Date(twoDaysAgo.getTime() + 45 * 60000),
            durationMinutes: 45,
            status: SessionStatus.COMPLETED,
            source: SessionSource.P2P_MATCH,
            mode: SessionMode.MEET,
            recordingUrl: 'https://zoom.us/rec/p2p-finished',
            meetSession: { create: {} },
            feedbacks: {
              create: [
                {
                  reviewerId: peerCandidate.id,
                  revieweeId: mainCandidate.id,
                  strengths: ['Giao tiếp tốt', 'Hiểu vấn đề'],
                  weaknesses: ['Trả lời hơi dài dòng'],
                  suggestions: ['Tập trung vào ý chính'],
                  overallScore: 3.8,
                  comment: 'Cần cải thiện thêm',
                  status: 'SUBMITTED',
                  deadline: now,
                  submittedAt: new Date(twoDaysAgo.getTime() + 1 * 60 * 60000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ---------- SOLO UPCOMING (trong 2 giờ) ----------
  await prisma.mockSession.create({
    data: {
      intervieweeId: mainCandidate.id,
      scheduledAt: in2Hours,
      durationMinutes: 30,
      status: SessionStatus.SCHEDULED,
      source: SessionSource.SOLO,
      mode: SessionMode.SOLO,
      soloSession: {
        create: { script: { text: 'Luyện tập câu hỏi System Design' } },
      },
    },
  });

  // ---------- SOLO FINISHED (quá khứ) ----------
  await prisma.mockSession.create({
    data: {
      intervieweeId: mainCandidate.id,
      scheduledAt: threeDaysAgo,
      startedAt: threeDaysAgo,
      endedAt: new Date(threeDaysAgo.getTime() + 30 * 60000),
      durationMinutes: 30,
      status: SessionStatus.COMPLETED,
      source: SessionSource.SOLO,
      mode: SessionMode.SOLO,
      soloSession: { create: { script: { text: 'Đã luyện xong' } } },
    },
  });

  // ---------- THÊM MENTOR FINISHED THỨ 2 (không có feedback) ----------
  await prisma.booking.create({
    data: {
      mentorId: mentorUser.id,
      candidateId: mainCandidate.id,
      coachingPlanId: coachingPlan.id,
      startTime: threeDaysAgo,
      endTime: new Date(threeDaysAgo.getTime() + 60 * 60000),
      snapshotPlanTitle: coachingPlan.title,
      status: BookingStatus.COMPLETED,
      mockSessions: {
        create: [
          {
            intervieweeId: mainCandidate.id,
            scheduledAt: threeDaysAgo,
            startedAt: threeDaysAgo,
            endedAt: new Date(threeDaysAgo.getTime() + 60 * 60000),
            durationMinutes: 60,
            status: SessionStatus.COMPLETED,
            source: SessionSource.MENTOR_BOOKING,
            mode: SessionMode.MEET,
            recordingUrl: null, // không có recording
            meetSession: { create: {} },
          },
        ],
      },
    },
  });

  console.log('✅ Seed dữ liệu Quản lý Phiên học thành công!');
  console.log('--------------------------------------------------');
  console.log('👤 Candidate: main.candidate@test.com / 123456');
  console.log('👤 Mentor: mentor.expert@test.com / 123456');
  console.log('👤 Peer1: peer.candidate@test.com / 123456');
  console.log('👤 Peer2: peer2.candidate@test.com / 123456');
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
