import { RecommendationScore } from './recommendation-score.interface';

export interface RecommendationResult {
  mentorId: number;

  score: RecommendationScore;
}
