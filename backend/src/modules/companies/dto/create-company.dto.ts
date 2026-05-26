// src/modules/companies/dto/create-company.dto.ts
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value)) // Chuỗi rỗng → null
  @IsUrl()
  logoUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  industry?: string | null;
}
