import { IsInt } from 'class-validator';

export class UpdateTargetRoleDto {
  @IsInt()
  target_role_id: number;
}
