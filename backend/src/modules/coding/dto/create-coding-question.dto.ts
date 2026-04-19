import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateCodingQuestionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  constraints?: string;

  @IsArray()
  @IsOptional()
  hints?: string[];

  @IsOptional()
  timeLimit?: number = 2000;

  @IsOptional()
  memoryLimit?: number = 256000;
}
