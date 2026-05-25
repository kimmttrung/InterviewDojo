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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UsePipes,
  ValidationPipe,
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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
@Controller('reports')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('user')
  @UseInterceptors(FilesInterceptor('evidenceFiles', 5)) // tối đa 5 file, field name là 'evidenceFiles'
  @ResponseMessage(Messages.REPORTS.REPORT_CREATED) // Dùng message từ Messages
  async createUserReport(
    @Request() req,
    @Body() dto: CreateUserReportDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UserReportItem> {
    const userId = req.user.sub; // hoặc req.user.id
    const evidenceUrls = dto.evidenceUrls || [];

    if (files && files.length) {
      for (const file of files) {
        let uploadResult;
        // Phân loại file dựa trên mimetype
        if (file.mimetype.startsWith('image/')) {
          // Bạn có thể tạo method uploadImageEvidence trong CloudinaryService
          uploadResult = await this.cloudinaryService.uploadImage(
            file,
            'reports/evidence',
          );
        } else if (file.mimetype.startsWith('video/')) {
          uploadResult = await this.cloudinaryService.uploadVideo(
            file,
            'reports/evidence_videos',
          );
        } else {
          throw new BadRequestException(
            'Only images and videos are allowed for evidence',
          );
        }
        evidenceUrls.push(uploadResult.secure_url);
      }
    }
    // Gộp URLs vào DTO để service xử lý
    dto.evidenceUrls = evidenceUrls;
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
