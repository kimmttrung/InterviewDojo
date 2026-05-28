import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { StreamService } from '../stream/stream.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meeting')
export class MeetingController {
  constructor(
    private readonly streamService: StreamService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('token/:roomId')
  @UseGuards(JwtAuthGuard)
  async getToken(@Param('roomId') roomId: string, @Req() req: any) {
    const userId = Number(req.user.sub); // Ép kiểu số cho đồng bộ database
    if (!userId || isNaN(userId)) throw new BadRequestException('Invalid user');

    // Tìm session theo ID (vì roomId chính là sessionId được convert sang string)
    const cleanRoomId = roomId.includes('-') ? roomId.split('-').pop() : roomId;
    const sessionId = parseInt(cleanRoomId || '', 10);

    if (isNaN(sessionId))
      throw new BadRequestException('Invalid room ID format');

    const session = await this.prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: { booking: true },
    });

    if (!session) {
      throw new NotFoundException(`No meeting found for room ${roomId}`);
    }

    // Đảm bảo session có booking
    if (!session.booking) {
      throw new BadRequestException('This meeting is not linked to a booking');
    }

    // Kiểm tra quyền tham gia chính xác
    const isMentor = session.booking.mentorId === userId;
    const isCandidate = session.booking.candidateId === userId;
    if (!isMentor && !isCandidate) {
      throw new ForbiddenException('You are not a participant of this meeting');
    }

    // Sinh token chính xác cho User ID đang gửi request lên
    const token = this.streamService.createToken(userId.toString());

    return {
      token,
      currentUserId: userId, // Đổi tên tường minh để tránh frontend map nhầm lẫn
      roomId,
      startTime: session.scheduledAt,
    };
  }
}
