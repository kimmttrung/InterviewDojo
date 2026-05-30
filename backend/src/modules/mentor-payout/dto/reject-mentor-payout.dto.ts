import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RejectMentorPayoutDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refundableAmount?: number;
}
