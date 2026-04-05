import { IsOptional, IsString } from 'class-validator';

export class UpdateTargetRoleDto {
  @IsOptional()
  @IsString()
  name?: string;
}
