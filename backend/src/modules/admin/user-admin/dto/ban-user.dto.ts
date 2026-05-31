import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BanDurationType {
  PERMANENT = 'PERMANENT',
  TEMPORARY = 'TEMPORARY',
}

export class BanUserDto {
  @IsEnum(BanDurationType)
  duration: BanDurationType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
