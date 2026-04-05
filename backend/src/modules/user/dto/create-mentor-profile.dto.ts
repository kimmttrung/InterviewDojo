import { IsOptional, IsUrl } from 'class-validator';

export class CreateMentorProfileDto {
  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}
