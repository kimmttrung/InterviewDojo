import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReportType, ReportTargetType } from '@prisma/client';

export class CreateUserReportDto {
  @Type(() => String) // giữ nguyên string rồi ép enum
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @Type(() => String)
  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsUrl({}, { each: true })
  evidenceUrls?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetUserId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  targetQuestionId?: number;

  @IsOptional()
  @IsString()
  snapshotQuestionTitle?: string;
}
