// slot.dto.ts
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SlotRecurrentType } from '@prisma/client';

export class CreateSlotDto {
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(SlotRecurrentType)
  recurrentType?: SlotRecurrentType;

  @IsOptional()
  @IsDateString()
  recurrentUntil?: string;
}

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(SlotRecurrentType)
  recurrentType?: SlotRecurrentType;

  @IsOptional()
  @IsDateString()
  recurrentUntil?: string | null;
}

export class QuerySlotDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mentorId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
