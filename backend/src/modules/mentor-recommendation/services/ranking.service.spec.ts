import { RECOMMENDATION_WEIGHT } from '../constants/recommendation-weight.constant';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  it('calculates weighted recommendation score', () => {
    const service = new RankingService();

    const result = service.rank({
      semantic: 1,
      targetRole: 0.5,
      skill: 0.25,
      availability: 0.75,
      language: 0.5,
      experience: 1,
      finalScore: 0,
    });

    expect(result).toBe(
      1 * RECOMMENDATION_WEIGHT.semantic +
        0.5 * RECOMMENDATION_WEIGHT.role +
        0.25 * RECOMMENDATION_WEIGHT.skill +
        0.75 * RECOMMENDATION_WEIGHT.availability +
        0.5 * RECOMMENDATION_WEIGHT.language +
        1 * RECOMMENDATION_WEIGHT.experience,
    );
  });
});
