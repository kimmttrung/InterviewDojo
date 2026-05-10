import {
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SlotStatus } from '@prisma/client';

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

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;
}

export class CreateSlotDto {
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endTime!: string;
}

export class CreateBatchSlotDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSlotDto)
  slots!: CreateSlotDto[];
}

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class DeleteBatchSlotDto {
  @IsArray()
  @IsInt({ each: true })
  slotIds!: number[];
}
