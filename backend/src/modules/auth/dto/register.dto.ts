import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(['CANDIDATE', 'MENTOR', 'STAFF'])
  role: 'CANDIDATE' | 'MENTOR' | 'STAFF';
}
