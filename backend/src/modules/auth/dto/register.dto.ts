import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  MENTOR = 'MENTOR',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
