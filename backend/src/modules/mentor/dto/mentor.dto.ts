import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUrl,
  ValidateNested,
  IsArray,
  IsEnum,
  ValidateIf,
  IsDateString,
  IsBoolean,
  IsNumber, // Bổ sung import IsNumber
} from 'class-validator';

import { Type, Transform } from 'class-transformer';
import {
  ApprovalStatus,
  SkillLevel,
  CoachingQuestionType, // Bổ sung import Enum này từ Prisma
} from '@prisma/client';

/**
 * =====================================================
 * QUERY MENTOR DTO
 * =====================================================
 */

export class QueryMentorDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  private static toNumberArray(value: any): number[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return value.split(',').map((v: string) => Number(v));
  }

  @IsOptional()
  @Transform(({ value }) => QueryMentorDto.toNumberArray(value))
  @IsInt({ each: true })
  roleIds?: number[];

  @IsOptional()
  @Transform(({ value }) => QueryMentorDto.toNumberArray(value))
  @IsInt({ each: true })
  companyIds?: number[];

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @Transform(({ value }) => QueryMentorDto.toNumberArray(value))
  @IsInt({ each: true })
  skillIds?: number[];

  @IsOptional()
  @Transform(({ value }) => QueryMentorDto.toNumberArray(value))
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * =====================================================
 * EXPERIENCE DTO
 * =====================================================
 */

export class UpdateExperienceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @Type(() => Number)
  @IsInt()
  companyId: number;

  @Type(() => Number)
  @IsInt()
  jobRoleId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @Type(() => Boolean)
  isCurrent?: boolean;

  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}

/**
 * =====================================================
 * SKILL DTO
 * =====================================================
 */

export class UpdateUserSkillDto {
  @Type(() => Number)
  @IsInt()
  skillId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceMonths: number;

  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}

/**
 * =====================================================
 * COACHING PLAN QUESTION DTO
 * =====================================================
 */
export class UpdateCoachingPlanQuestionDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  question: string;

  @IsEnum(CoachingQuestionType) // Bắt buộc phải là 'TEXT' hoặc 'FILE'
  type: CoachingQuestionType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

/**
 * =====================================================
 * COACHING PLAN DTO
 * =====================================================
 */
export class UpdateCoachingPlanDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  duration: number; // Phút

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Validate mảng câu hỏi bên trong
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCoachingPlanQuestionDto)
  questions?: UpdateCoachingPlanQuestionDto[];
}

/**
 * =====================================================
 * UPDATE MENTOR DTO (CHÍNH)
 * =====================================================
 */

export class UpdateMentorDto {
  // ================= USER =================

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedInLink?: string;

  @IsOptional()
  @IsUrl()
  githubLink?: string;

  // ================= MENTOR PROFILE =================

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsUrl()
  @ValidateIf((obj, value) => value !== '')
  introductionVideoUrl?: string;

  // ================= EXPERIENCES =================

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExperienceDto)
  experiences?: UpdateExperienceDto[];

  // ================= SKILLS =================

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserSkillDto)
  skills?: UpdateUserSkillDto[];

  // ================= COACHING PLANS =================

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCoachingPlanDto)
  coachingPlans?: UpdateCoachingPlanDto[];
}
