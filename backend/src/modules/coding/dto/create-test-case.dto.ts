import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  input!: string;

  @IsString()
  @IsNotEmpty()
  expectedOutput!: string;

  @IsBoolean()
  @IsOptional()
  isSample?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isHidden?: boolean = false;

  @IsNumber()
  @IsOptional()
  points?: number = 1;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}
