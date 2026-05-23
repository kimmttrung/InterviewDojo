// src/modules/reports/dto/create-user-report.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ReportTargetType } from '@prisma/client';

export class CreateUserReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsUrl({}, { each: true })
  evidenceUrls?: string[] = [];

  // Context fields - chỉ 1 field được dùng dựa trên targetType
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetUserId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetQuestionId?: number;

  @IsOptional()
  @IsString()
  snapshotQuestionTitle?: string;
}
