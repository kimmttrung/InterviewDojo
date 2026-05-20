import { IsBooleanString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsBooleanString()
  isRead?: string;
}
