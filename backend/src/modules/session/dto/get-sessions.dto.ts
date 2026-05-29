import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SessionSource, SessionStatus } from '@prisma/client';

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

  @IsOptional()
  @IsEnum(SessionSource)
  type?: SessionSource; // MENTOR_BOOKING, P2P_MATCH, SOLO

  @IsOptional()
  @IsArray()
  @IsEnum(SessionStatus, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  statuses?: SessionStatus[];
}
