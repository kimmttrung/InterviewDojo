// src/modules/booking/dto/booking.dto.ts
import {
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  IsString,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class QueryBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

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
}

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

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  slotId!: number;

  @IsInt()
  @Min(1)
  coachingPlanId!: number;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingAnswerDto)
  answers?: CreateBookingAnswerDto[];
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}

export class PaymentDto {
  @IsEnum(['INTERNAL_WALLET', 'VNPAY', 'MOMO'])
  method!: string;
}
