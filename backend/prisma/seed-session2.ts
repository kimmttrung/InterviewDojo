// import 'dotenv/config';

// import {
//   BookingStatus,
//   PrismaClient,
//   Role,
//   SessionMode,
//   SessionSource,
//   SessionStatus,
// } from '@prisma/client';

// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL!,
// });

// const prisma = new PrismaClient({
//   adapter: new PrismaPg(pool),
// });

// async function main() {
//   console.log('🌱 Seeding session page data...');

//   // =====================================================
//   // USERS
//   // =====================================================

//   let candidate = await prisma.user.findFirst({
//     where: {
//       role: Role.CANDIDATE,
//     },
//   });

//   if (!candidate) {
//     candidate = await prisma.user.create({
//       data: {
//         email: 'candidate.session@test.com',
//         password: '123456',
//         name: 'Nguyen Candidate',
//         role: Role.CANDIDATE,
//         avatarUrl: 'https://i.pravatar.cc/300?img=20',
//         bio: 'Backend developer preparing for senior interviews',
//       },
//     });
//   }

//   const mentors = await prisma.user.findMany({
//     where: {
//       role: Role.MENTOR,
//     },
//     include: {
//       mentorProfile: true,
//     },
//     take: 5,
//   });

//   if (mentors.length === 0) {
//     throw new Error('No mentor found. Please run seed-mentor.ts first.');
//   }

//   const coachingPlans = await prisma.coachingPlan.findMany({
//     take: 5,
//   });

//   if (coachingPlans.length === 0) {
//     throw new Error('No coaching plan found. Please run seed-mentor.ts first.');
//   }

//   // =====================================================
//   // CLEAN OLD SESSION TEST DATA
//   // =====================================================

//   await prisma.feedback.deleteMany({
//     where: {
//       comment: {
//         contains: '[SESSION_PAGE_TEST]',
//       },
//     },
//   });

//   const oldSessions = await prisma.mockSession.findMany({
//     where: {
//       OR: [
//         {
//           meetingUrl: {
//             contains: 'session-page-test',
//           },
//         },
//         {
//           recordingUrl: {
//             contains: 'session-page-test',
//           },
//         },
//       ],
//     },
//     select: {
//       id: true,
//     },
//   });

//   await prisma.mockSession.deleteMany({
//     where: {
//       id: {
//         in: oldSessions.map((s) => s.id),
//       },
//     },
//   });

//   // =====================================================
//   // HELPERS
//   // =====================================================

//   const now = new Date();

//   const createBooking = async ({
//     mentorId,
//     coachingPlanId,
//     startTime,
//     status,
//     title,
//   }: {
//     mentorId: number;
//     coachingPlanId: number;
//     startTime: Date;
//     status: BookingStatus;
//     title: string;
//   }) => {
//     return prisma.booking.create({
//       data: {
//         mentorId,
//         candidateId: candidate.id,
//         coachingPlanId,
//         startTime,
//         endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
//         snapshotPlanTitle: title,
//         status,
//       },
//     });
//   };

//   // =====================================================
//   // UPCOMING SESSIONS
//   // =====================================================

//   // 1. Join button enabled (< 30 mins)
//   const upcomingSoonBooking = await createBooking({
//     mentorId: mentors[0].id,
//     coachingPlanId: coachingPlans[0].id,
//     startTime: new Date(now.getTime() + 20 * 60 * 1000),
//     status: BookingStatus.ACCEPTED,
//     title: 'Senior Backend Mock Interview',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: upcomingSoonBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: upcomingSoonBooking.startTime,
//       durationMinutes: 60,
//       status: SessionStatus.SCHEDULED,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//       meetingUrl: 'https://meet.google.com/session-page-test-upcoming-1',
//       meetingCode: 'UPCOMING-001',
//     },
//   });

//   // 2. Upcoming mentor session
//   const upcomingMentorBooking = await createBooking({
//     mentorId: mentors[1].id,
//     coachingPlanId: coachingPlans[1].id,
//     startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
//     status: BookingStatus.ACCEPTED,
//     title: 'System Design Coaching',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: upcomingMentorBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: upcomingMentorBooking.startTime,
//       durationMinutes: 90,
//       status: SessionStatus.SCHEDULED,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//       meetingUrl: 'https://meet.google.com/session-page-test-upcoming-2',
//       meetingCode: 'UPCOMING-002',
//     },
//   });

//   // 3. Upcoming P2P session
//   const p2pBooking = await createBooking({
//     mentorId: mentors[2].id,
//     coachingPlanId: coachingPlans[2].id,
//     startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
//     status: BookingStatus.ACCEPTED,
//     title: 'Peer Mock Interview',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: p2pBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: p2pBooking.startTime,
//       durationMinutes: 45,
//       status: SessionStatus.SCHEDULED,
//       source: SessionSource.PEER,
//       mode: SessionMode.MEET,
//       meetingUrl: 'https://meet.google.com/session-page-test-p2p',
//       meetingCode: 'P2P-001',
//     },
//   });

//   // =====================================================
//   // PENDING SESSIONS
//   // =====================================================

//   const pendingBooking = await createBooking({
//     mentorId: mentors[3].id,
//     coachingPlanId: coachingPlans[3].id,
//     startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
//     status: BookingStatus.PENDING,
//     title: 'Frontend Architecture Review',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: pendingBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: pendingBooking.startTime,
//       durationMinutes: 60,
//       status: SessionStatus.PENDING,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//     },
//   });

//   // =====================================================
//   // REJECTED SESSIONS
//   // =====================================================

//   const rejectedBooking = await createBooking({
//     mentorId: mentors[4].id,
//     coachingPlanId: coachingPlans[4].id,
//     startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
//     status: BookingStatus.REJECTED,
//     title: 'Leadership Coaching Session',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: rejectedBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: rejectedBooking.startTime,
//       durationMinutes: 60,
//       status: SessionStatus.CANCELLED,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//       cancellationReason:
//         'Mentor is unavailable due to schedule conflict. Please rebook another slot.',
//     },
//   });

//   // =====================================================
//   // FINISHED SESSIONS
//   // =====================================================

//   const finishedBooking1 = await createBooking({
//     mentorId: mentors[0].id,
//     coachingPlanId: coachingPlans[0].id,
//     startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
//     status: BookingStatus.COMPLETED,
//     title: 'Backend System Design Interview',
//   });

//   const finishedSession1 = await prisma.mockSession.create({
//     data: {
//       bookingId: finishedBooking1.id,
//       intervieweeId: candidate.id,
//       scheduledAt: finishedBooking1.startTime,
//       durationMinutes: 60,
//       status: SessionStatus.COMPLETED,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//       meetingUrl: 'https://meet.google.com/session-page-test-finished-1',
//       recordingUrl:
//         'https://recording.example.com/session-page-test-recording-1',
//     },
//   });

//   await prisma.feedback.create({
//     data: {
//       sessionId: finishedSession1.id,
//       reviewerId: mentors[0].id,
//       revieweeId: candidate.id,
//       strengths: [
//         'Strong API design knowledge',
//         'Good database optimization skills',
//       ],
//       weaknesses: ['Need more confidence in communication'],
//       suggestions: ['Practice explaining trade-offs more clearly'],
//       overallScore: 8.5,
//       comment:
//         '[SESSION_PAGE_TEST] Candidate performed well in backend and scaling discussion.',
//       deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
//     },
//   });

//   // Solo session
//   const soloSession = await prisma.mockSession.create({
//     data: {
//       intervieweeId: candidate.id,
//       scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
//       durationMinutes: 45,
//       status: SessionStatus.COMPLETED,
//       source: SessionSource.SOLO,
//       mode: SessionMode.SOLO,
//       recordingUrl: 'https://recording.example.com/session-page-test-solo',
//     },
//   });

//   await prisma.feedback.create({
//     data: {
//       sessionId: soloSession.id,
//       revieweeId: candidate.id,
//       strengths: ['Logical thinking', 'Good coding speed'],
//       weaknesses: ['Edge case handling'],
//       suggestions: ['Practice more graph problems'],
//       overallScore: 7.8,
//       comment: '[SESSION_PAGE_TEST] AI evaluation for solo mock interview.',
//       deadline: new Date(),
//     },
//   });

//   // In-progress session
//   const inProgressBooking = await createBooking({
//     mentorId: mentors[1].id,
//     coachingPlanId: coachingPlans[1].id,
//     startTime: new Date(now.getTime() - 10 * 60 * 1000),
//     status: BookingStatus.ACCEPTED,
//     title: 'Live Mock Interview In Progress',
//   });

//   await prisma.mockSession.create({
//     data: {
//       bookingId: inProgressBooking.id,
//       intervieweeId: candidate.id,
//       scheduledAt: inProgressBooking.startTime,
//       durationMinutes: 60,
//       status: SessionStatus.IN_PROGRESS,
//       source: SessionSource.MENTOR_BOOKING,
//       mode: SessionMode.MEET,
//       meetingUrl: 'https://meet.google.com/session-page-test-live',
//       meetingCode: 'LIVE-001',
//     },
//   });

//   console.log('✅ Session page seed completed!');
//   console.log('');
//   console.log('Seed data includes:');
//   console.log('- Upcoming sessions');
//   console.log('- Pending sessions');
//   console.log('- Rejected sessions');
//   console.log('- Finished sessions');
//   console.log('- Solo sessions');
//   console.log('- P2P sessions');
//   console.log('- In-progress session');
//   console.log('- Feedback + recording links');
//   console.log('- Join enabled (<30 mins)');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
