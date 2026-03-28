import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class GetQuestionsFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  companyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetRoleId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
