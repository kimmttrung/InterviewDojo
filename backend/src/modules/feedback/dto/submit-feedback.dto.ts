import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsString,
  IsNotEmpty,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  overallScore: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  quickTags?: string[];

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  weaknesses?: string;

  @IsOptional()
  @IsString()
  suggestions?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
