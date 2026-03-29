import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Difficulty, TypeQuestion } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'two-sum' })
  @IsString()
  slug: string;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ enum: TypeQuestion })
  @IsEnum(TypeQuestion)
  typeQuestion: TypeQuestion;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ example: { content: '...', sampleAnswer: '...' } })
  @IsObject()
  data: Record<string, any>; // chứa json

  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @ApiPropertyOptional({ type: [Number], example: [1] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  companyIds?: number[];
}
