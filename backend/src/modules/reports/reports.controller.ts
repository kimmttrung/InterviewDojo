import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { UploadedFileType } from '@/common/types/uploaded-file.type';
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('user')
  @UseInterceptors(FilesInterceptor('evidenceFiles', 5))
  @ResponseMessage(Messages.REPORTS.REPORT_CREATED)
  async createUserReport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUserReportDto,
    @UploadedFiles() files: UploadedFileType[],
  ) {
    return this.reportsService.createReport(user.sub, dto, files);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.REPORTS.REPORTS_LIST_FETCHED)
  async findAll(@Query() query: QueryReportsDto) {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.REPORTS.REPORT_FETCHED)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.REPORTS.REPORT_STATUS_UPDATED)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.reportsService.updateStatus(id, admin.sub, dto);
  }

  @Post('comment')
  @UseGuards(JwtAuthGuard)
  async reportComment(
    @CurrentUser() user: JwtPayload,
    @Body() body: { commentId: number; reason: any },
  ) {
    // 2. Truyền user.sub (chính là ID của người dùng) vào service
    return await this.reportsService.reportComment(user.sub, body);
  }
}
