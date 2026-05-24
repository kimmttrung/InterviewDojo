import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Messages } from '../../../common/constants/messages.constant';

@Controller('admin/statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ResponseMessage(Messages.ADMIN.STATISTICS_FETCHED)
  async getStatistics() {
    return this.statisticsService.getStats();
  }
}
