// random-question.dto.ts
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class RandomQuestionDto {
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  jobRole?: string;
}
