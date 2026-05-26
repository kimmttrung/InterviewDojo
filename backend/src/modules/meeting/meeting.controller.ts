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
    const userId = req.user.sub;
    if (!userId) throw new BadRequestException('Invalid user');

    const session = await this.prisma.mockSession.findFirst({
      where: { meetingLink: { contains: roomId } },
      include: { booking: true },
    });

    if (!session) {
      throw new NotFoundException(`No meeting found for room ${roomId}`);
    }

    // Đảm bảo session có booking (vì meeting chỉ được tạo từ booking)
    if (!session.booking) {
      throw new BadRequestException('This meeting is not linked to a booking');
    }

    const isMentor = session.booking.mentorId === userId;
    const isCandidate = session.booking.candidateId === userId;
    if (!isMentor && !isCandidate) {
      throw new ForbiddenException('You are not a participant of this meeting');
    }

    const token = this.streamService.createToken(userId.toString());
    return { token, userId, roomId, startTime: session.scheduledAt };
  }
}
