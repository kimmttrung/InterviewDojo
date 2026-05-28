// src/modules/admin/wallet-admin/dto/transaction-query.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { WalletTransactionType } from '@prisma/client';

export class AdminTransactionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  search?: string; // tìm theo email, name, referenceId

  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
