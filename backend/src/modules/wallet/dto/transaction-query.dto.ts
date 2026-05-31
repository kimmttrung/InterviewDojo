import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';

import { Type } from 'class-transformer';
import { WalletTransactionType } from '@prisma/client';

export class TransactionQueryDto {
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

  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;
}
