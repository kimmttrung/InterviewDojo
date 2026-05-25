import { Injectable } from '@nestjs/common';

@Injectable()
export class ExperienceScoreService {
  calculate(
    mentor: number,

    candidate: number,
  ): number {
    const gap = mentor - candidate;

    if (gap < 0) {
      return 0;
    }

    if (gap <= 2) {
      return 0.7;
    }

    if (gap <= 6) {
      return 1;
    }

    if (gap <= 10) {
      return 0.85;
    }

    return 0.7;
  }
}
