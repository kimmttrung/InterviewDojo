import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, QuestionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CodingDataDto {
  @ApiProperty({ example: 'Viết hàm tính tổng 2 số...' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: '0 <= N <= 10^5' })
  @IsOptional()
  @IsString()
  constraints?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @ApiPropertyOptional({ example: 256000 })
  @IsOptional()
  @IsNumber()
  memoryLimit?: number;

  @ApiPropertyOptional({ example: 'https://codeforces.com/...' })
  @IsOptional()
  @IsString()
  codeforcesLink?: string;
}

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

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

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

  @ApiPropertyOptional({ type: [Number], example: [1, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  jobRoleIds?: number[];

  @ApiPropertyOptional({
    example: { question: 'NodeJS là gì?', sampleAnswer: 'Là runtime...' },
  })
  @IsOptional()
  @IsObject()
  theoryData?: Record<string, any>;

  @ApiPropertyOptional({ type: CodingDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CodingDataDto)
  codingData?: CodingDataDto;
}
