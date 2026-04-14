import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTargetRoleDto } from './create-target-role.dto';

export class CreateMultipleTargetRoleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTargetRoleDto)
  roles: CreateTargetRoleDto[];
}
