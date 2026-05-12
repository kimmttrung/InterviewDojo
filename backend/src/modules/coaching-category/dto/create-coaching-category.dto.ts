import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
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
