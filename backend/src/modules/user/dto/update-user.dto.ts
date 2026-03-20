import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name: string;

  @IsString()
  bio: string;

  @IsString()
  target_role: string;

  @IsNumber()
  experience_years: number;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
