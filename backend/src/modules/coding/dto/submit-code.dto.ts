import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SubmitCodeDto {
  @IsNumber()
  @IsNotEmpty()
  codingQuestionId!: number;

  @IsString()
  @IsNotEmpty()
  languageId!: string;   // "71", "54", "63"

  @IsString()
  @IsNotEmpty()
  sourceCode!: string;
}