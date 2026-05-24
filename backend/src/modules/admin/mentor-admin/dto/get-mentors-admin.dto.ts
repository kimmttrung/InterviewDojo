import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { ApprovalStatus } from '@prisma/client';

export class GetMentorsAdminDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}
