import { ExperienceScoreService } from './experience-score.service';

describe('ExperienceScoreService', () => {
  const service = new ExperienceScoreService();

  it.each([
    [1, 3, 0],
    [4, 3, 0.7],
    [8, 3, 1],
    [13, 3, 0.85],
    [20, 3, 0.7],
  ])('scores mentor=%i candidate=%i as %f', (mentor, candidate, expected) => {
    expect(service.calculate(mentor, candidate)).toBe(expected);
  });
});
