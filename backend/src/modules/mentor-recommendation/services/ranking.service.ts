import { Injectable } from '@nestjs/common';
import { RecommendationScore } from '../interfaces/recommendation-score.interface';
import { RECOMMENDATION_WEIGHT } from '../constants/recommendation-weight.constant';

@Injectable()
export class RankingService {
  rank(score: RecommendationScore): number {
    return (
      score.semantic * RECOMMENDATION_WEIGHT.semantic +
      score.role * RECOMMENDATION_WEIGHT.role +
      score.skill * RECOMMENDATION_WEIGHT.skill +
      score.availability * RECOMMENDATION_WEIGHT.availability +
      score.language * RECOMMENDATION_WEIGHT.language +
      score.experience * RECOMMENDATION_WEIGHT.experience
    );
  }
}
