// backend/src/modules/reports/dto/update-report-status.dto.ts
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus; // RESOLVED, REJECTED

  @IsOptional()
  @IsString()
  adminNote?: string;
}
