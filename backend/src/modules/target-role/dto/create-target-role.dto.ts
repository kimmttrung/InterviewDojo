import { IsString } from 'class-validator';

export class CreateTargetRoleDto {
  @IsString()
  name!: string;
}
