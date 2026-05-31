import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { DashboardService } from './candidate-dashboard.service';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
@Controller('candidate/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('analytics/:userId')
  @ResponseMessage(Messages.CANDIDATE_DASHBOARD.GET_ANALYTICS_SUCCESS)
  async getAnalyticsOverview(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.dashboardService.getAnalyticsOverview(userId);

    return data;
  }

  @Get('ai-summary/:userId')
  @ResponseMessage(Messages.CANDIDATE_DASHBOARD.GET_AI_SUMMARY_SUCCESS)
  async getAISummary(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.dashboardService.getAISummary(userId);

    return data;
  }

  @Get('upcoming-sessions/:userId')
  @ResponseMessage(Messages.CANDIDATE_DASHBOARD.GET_UPCOMING_SESSIONS_SUCCESS)
  async getUpcomingSessions(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.dashboardService.getUpcomingSessions(userId);

    return data;
  }

  @Get('interested-categories/:userId')
  @ResponseMessage(
    Messages.CANDIDATE_DASHBOARD.GET_INTERESTED_CATEGORIES_SUCCESS,
  )
  async getInterestedCategories(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.dashboardService.getInterestedCategories(userId);

    return data;
  }
}
