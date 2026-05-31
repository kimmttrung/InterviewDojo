import { IsString, IsNotEmpty } from 'class-validator';

export class RejectMentorDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
