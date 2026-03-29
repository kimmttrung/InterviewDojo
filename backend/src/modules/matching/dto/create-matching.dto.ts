import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMatchingDto {
  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  @IsString()
  level: string; // Junior, Mid, Senior
}
