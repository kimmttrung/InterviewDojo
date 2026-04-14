import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  target_role_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skill_ids?: number[];
}
