import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  IsNumber,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, QuestionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestCaseDto {
  @ApiProperty({ example: '[1,2,3]\n9' })
  @IsString()
  input: string;

  @ApiProperty({ example: '[0,1]' })
  @IsString()
  expectedOutput: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSample?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 'nums[0] + nums[1] = 9' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

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

  @ApiPropertyOptional({ type: [String], example: ['array', 'hash-table'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Try using a hash map'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ type: [TestCaseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  testCases?: TestCaseDto[];
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
    example: {
      question: 'NodeJS là gì?',
      tips: [],
      followUps: [],
      keyPoints: [],
    },
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
