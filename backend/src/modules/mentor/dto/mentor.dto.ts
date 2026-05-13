import { IsOptional, IsString, IsInt, Min, IsUrl } from 'class-validator';

import { Type, Transform } from 'class-transformer';

import { ApprovalStatus } from '@prisma/client';

export class QueryMentorDto {
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

  @IsOptional()
  @IsString()
  status?: ApprovalStatus;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : value?.split(',').map(Number),
  )
  @IsInt({ each: true })
  roleIds?: number[];

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : value?.split(',').map(Number),
  )
  @IsInt({ each: true })
  companyIds?: number[];

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : value?.split(',').map(Number),
  )
  @IsInt({ each: true })
  skillIds?: number[];

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : value?.split(',').map(Number),
  )
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsString()
  search?: string;
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
