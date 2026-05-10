// get-questions.dto.ts
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, QuestionType } from '@prisma/client';

export class GetQuestionsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

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
  @IsEnum(QuestionType)
  type?: QuestionType; // đã có questionType, nhưng để đồng bộ tôi dùng 'type'

  @IsOptional()
  @IsString()
  category?: string; // lọc theo tên category

  @IsOptional()
  @IsString()
  jobRole?: string; // lọc theo tên job role
}
