import { IsEmail, IsOptional, IsString, MinLength, IsUrl } from 'class-validator';

export class RegisterMentorDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}