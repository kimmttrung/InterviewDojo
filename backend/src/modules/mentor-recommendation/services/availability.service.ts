import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  calculate(
    candidateHours: number[],

    mentorHours: number[],
  ): number {
    const overlap = candidateHours.filter((hour) =>
      mentorHours.includes(hour),
    ).length;

    return overlap / candidateHours.length;
  }
}
