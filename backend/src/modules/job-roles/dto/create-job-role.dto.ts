// src/modules/job-roles/dto/create-job-role.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateJobRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
