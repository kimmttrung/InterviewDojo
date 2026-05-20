// src/modules/feedback/feedback.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { FeedbackService } from './feedback.service';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@ApiTags('Feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('session/:sessionId')
  @ResponseMessage(Messages.FEEDBACK.SUBMITTED)
  async submitFeedback(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SubmitFeedbackDto,
  ) {
    return this.feedbackService.submitFeedback(+sessionId, user.sub, dto);
  }

  @Get('session/:sessionId/my')
  @ResponseMessage(Messages.FEEDBACK.FETCHED_MY)
  async getMyFeedback(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.getMyFeedback(+sessionId, user.sub);
  }

  @Get('session/:sessionId/partner')
  @ResponseMessage(Messages.FEEDBACK.FETCHED_PARTNER)
  async getPartnerFeedback(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.getPartnerFeedback(+sessionId, user.sub);
  }

  @Get('my-received')
  @ResponseMessage(Messages.FEEDBACK.FETCHED_RECEIVED)
  async getMyReceivedFeedbacks(@CurrentUser() user: any) {
    return this.feedbackService.getMyReceivedFeedbacks(user.sub);
  }
}
