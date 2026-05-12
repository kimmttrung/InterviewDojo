import {
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { BookingStatus } from '@prisma/client';

import { Min } from 'class-validator';

/**
 * Query booking
 */
export class QueryBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}

/**
 * Booking answer
 */
export class CreateBookingAnswerDto {
  @IsInt()
  @Min(1)
  questionId!: number;

  @IsOptional()
  @IsString()
  answerText?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

/**
 * Create booking
 */
export class CreateBookingDto {
  @IsInt()
  @Min(1)
  slotId!: number;

  @IsInt()
  @Min(1)
  coachingPlanId!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingAnswerDto)
  answers?: CreateBookingAnswerDto[];
}

/**
 * Update booking status
 */
export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
