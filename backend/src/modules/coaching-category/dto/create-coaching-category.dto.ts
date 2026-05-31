import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryCoachingDto {
  @IsString()
  @IsNotEmpty()
  slug!: string; // ← thêm !

  @IsString()
  @IsNotEmpty()
  name!: string; // ← thêm !

  @IsOptional()
  @IsString()
  description?: string;
}
