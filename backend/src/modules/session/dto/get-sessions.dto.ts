import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SessionTab {
  ALL = 'ALL',
  PENDING = 'PENDING',
  UPCOMING = 'UPCOMING',
  REJECTED = 'REJECTED',
  FINISHED = 'FINISHED',
}

export class GetSessionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SessionTab)
  tab?: SessionTab = SessionTab.ALL;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string; // Format: YYYY-MM-DD

  @IsOptional()
  @IsString()
  endDate?: string; // Format: YYYY-MM-DD
}
