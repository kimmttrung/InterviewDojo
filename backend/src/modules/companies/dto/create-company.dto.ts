// src/modules/companies/dto/create-company.dto.ts
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}
