import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { QueryMentorPayoutDto } from './dto/query-mentor-payout.dto';
import { RejectMentorPayoutDto } from './dto/reject-mentor-payout.dto';
import { MentorPayoutService } from './mentor-payout.service';

@Controller('admin/mentor-payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MentorPayoutController {
  constructor(private readonly mentorPayoutService: MentorPayoutService) {}

  @Get()
  getPayouts(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: QueryMentorPayoutDto,
  ) {
    return this.mentorPayoutService.getPayouts(query);
  }

  @Post(':id/approve')
  approvePayout(
    @Param('id', ParseIntPipe) payoutId: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.mentorPayoutService.approvePayout(payoutId, admin.sub);
  }

  @Post(':id/reject')
  rejectPayout(
    @Param('id', ParseIntPipe) payoutId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RejectMentorPayoutDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.mentorPayoutService.rejectPayout(
      payoutId,
      admin.sub,
      dto.reason,
      dto.refundableAmount,
    );
  }
}

@Controller('admin/payout')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPayoutRetryController {
  constructor(private readonly mentorPayoutService: MentorPayoutService) {}

  @Get('retryable')
  getRetryablePayouts(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: QueryMentorPayoutDto,
  ) {
    return this.mentorPayoutService.getRetryablePayoutSessions(query);
  }

  @Post('retry/:sessionId')
  retryPayout(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.mentorPayoutService.retryPayoutForSession(sessionId);
  }
}

@Controller('mentor/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MENTOR) // Chỉ Mentor mới được truy cập
export class MentorOwnPayoutController {
  constructor(private readonly mentorPayoutService: MentorPayoutService) {}

  @Get()
  getMyPayouts(
    @CurrentUser() mentor: JwtPayload,
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: QueryMentorPayoutDto,
  ) {
    // Truyền mentor.sub (chính là ID của mentor đang đăng nhập) vào service
    return this.mentorPayoutService.getMyPayouts(mentor.sub, query);
  }
}
