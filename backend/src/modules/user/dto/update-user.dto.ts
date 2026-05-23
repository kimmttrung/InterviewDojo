import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { SkillLevel } from '@prisma/client';

export class UpdateUserSkillDto {
  @IsInt()
  skillId: number;

  @IsInt()
  @Min(0)
  experienceMonths: number;

  @IsEnum(SkillLevel)
  level: SkillLevel;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  targetRoleId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  linkedInLink?: string;

  @IsOptional()
  @IsString()
  githubLink?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => UpdateUserSkillDto)
  skills?: UpdateUserSkillDto[];
}
