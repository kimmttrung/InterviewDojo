import { IsString, IsOptional } from 'class-validator';

export class CreateTargetRoleDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
