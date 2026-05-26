import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { Role, UserStatus } from '@prisma/client';

export class GetUsersAdminDto extends PaginationDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
