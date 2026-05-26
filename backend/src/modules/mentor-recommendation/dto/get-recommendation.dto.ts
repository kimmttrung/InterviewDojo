import { IsInt } from 'class-validator';

export class GetRecommendationDto {
  @IsInt()
  candidateId: number;
}
