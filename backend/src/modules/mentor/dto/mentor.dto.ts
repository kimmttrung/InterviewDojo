import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  Min,
  IsUrl,
} from 'class-validator';

import { Type } from 'class-transformer';

import { ApprovalStatus } from '@prisma/client';

export class QueryMentorDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class UpdateMentorDto {
  /**
   * =========================
   * User fields
   * =========================
   */

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

  /**
   * =========================
   * MentorProfile fields
   * =========================
   */

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsUrl()
  introductionVideoUrl?: string;
}
