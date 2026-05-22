// dto/query-bookmark.dto.ts
import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Difficulty } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryBookmarkDto {
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
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  categoryIds?: number[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
