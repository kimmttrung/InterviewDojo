// src/modules/reports/reports.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import {
  ReportsPaginatedResponse,
  UserReportItem,
} from './interfaces/user-report.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Messages } from '@/common/constants/messages.constant';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('user')
  @ResponseMessage(Messages.REPORTS.REPORT_CREATED) // Dùng message từ Messages
  async createUserReport(
    @Request() req,
    @Body() dto: CreateUserReportDto,
  ): Promise<UserReportItem> {
    const userId = req.user.sub; // hoặc req.user.id
    return this.reportsService.createReport(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ResponseMessage(Messages.REPORTS.REPORTS_LIST_FETCHED)
  async findAll(
    @Query() query: QueryReportsDto,
    @Request() req,
  ): Promise<ReportsPaginatedResponse> {
    const isAdmin = req.user.role === 'ADMIN';
    return this.reportsService.findAll(query, isAdmin);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ResponseMessage(Messages.REPORTS.REPORT_FETCHED)
  async findOne(@Param('id') id: string): Promise<UserReportItem> {
    return this.reportsService.findOne(Number(id));
  }
}
