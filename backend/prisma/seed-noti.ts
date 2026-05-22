// import 'dotenv/config';
// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';

// const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
// const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// async function main() {
//   console.log('🌱 Bắt đầu seed dữ liệu Thông báo (Notifications)...');

//   const mainCandidate = await prisma.user.findUnique({
//     where: { email: 'main.candidate@test.com' },
//   });

//   if (!mainCandidate) return;

//   // Lưu ý: Thay đổi trường dữ liệu cho khớp 100% với model Notification của bạn
//   const notifications = [
//     {
//       userId: mainCandidate.id,
//       title: 'Lịch hẹn đã được xác nhận!',
//       content:
//         'Mentor Expert đã chấp nhận yêu cầu đặt lịch của bạn vào lúc 14:00 ngày mai.',
//       type: 'BOOKING_ACCEPTED' as any,
//       isRead: false,
//       createdAt: new Date(),
//     },
//     {
//       userId: mainCandidate.id,
//       title: 'Nhắc nhở phiên học',
//       content:
//         'Bạn có một phiên học P2P sẽ diễn ra trong 30 phút nữa. Hãy chuẩn bị nhé!',
//       type: 'SESSION_REMINDER' as any,
//       isRead: false,
//       createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 phút trước
//     },
//     {
//       userId: mainCandidate.id,
//       title: 'Thanh toán thành công',
//       content: 'Giao dịch nạp 500,000 VNĐ vào ví đã hoàn tất.',
//       type: 'PAYMENT_SUCCESS' as any,
//       isRead: true,
//       createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 ngày trước
//     },
//     {
//       userId: mainCandidate.id,
//       title: 'Có kết quả đánh giá AI',
//       content: 'Kết quả phân tích Solo Session của bạn đã sẵn sàng. Xem ngay!',
//       type: 'AI_FEEDBACK_READY' as any,
//       isRead: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
//     },
//   ];

//   // Nếu bạn dùng model Notification
//   // await prisma.notification.createMany({ data: notifications });
//   // (Uncomment dòng trên nếu schema của bạn có model Notification)

//   console.log('✅ Seed dữ liệu Thông báo thành công!');
// }

// main()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());
