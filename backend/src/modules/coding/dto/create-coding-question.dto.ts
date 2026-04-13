import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateCodingQuestionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  description!: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  codeforcesLink?: string;
}