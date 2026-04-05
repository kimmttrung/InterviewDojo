import { IsString } from 'class-validator';

export class ExecuteCodeDto {
  @IsString()
  code: string;

  @IsString()
  languageId: string; // vẫn string, sẽ ép kiểu Number trong service
}
