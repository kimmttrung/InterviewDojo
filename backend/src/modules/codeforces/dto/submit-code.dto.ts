import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SubmitCodeDto {
  @IsNumber()
  @IsNotEmpty()
  contestId: number;

  @IsString()
  @IsNotEmpty()
  problemIndex: string;

  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @IsNumber()
  @IsNotEmpty()
  languageId: number;

  @IsString()
  @IsOptional()
  handle?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
