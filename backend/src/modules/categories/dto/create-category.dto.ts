import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Frontend' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Các câu hỏi về React, Vue' })
  @IsString()
  @IsOptional()
  description?: string;
}
