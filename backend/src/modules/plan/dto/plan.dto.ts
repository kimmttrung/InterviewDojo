import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
//import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsInt()
  @IsNotEmpty()
  categoryId!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
